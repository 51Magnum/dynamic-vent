const nodemailer = require("nodemailer");
const quoteConfirmation = require("../src/data/quote-confirmation.json");
const MAX_FILES = 3;
const MAX_BYTES = 2 * 1024 * 1024;
const validEmail = (value) =>
  typeof value === "string" &&
  value.length <= 254 &&
  /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) &&
  !/[\r\n]/.test(value);
const text = (value, max) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

function readAttachments(files = []) {
  if (!Array.isArray(files) || files.length > MAX_FILES)
    throw new Error("Invalid files");
  let total = 0;
  return files.map((file) => {
    if (
      !file ||
      !text(file.name, 150) ||
      typeof file.content !== "string" ||
      file.content.length > Math.ceil(MAX_BYTES / 3) * 4 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        file.content,
      )
    )
      throw new Error("Invalid file");
    const content = Buffer.from(file.content, "base64");
    total += content.length;
    const png = content
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = content[0] === 255 && content[1] === 216 && content[2] === 255;
    const pdf = content.subarray(0, 5).toString() === "%PDF-";
    const extension = png ? "png" : jpg ? "jpg" : pdf ? "pdf" : "";
    if (
      !extension ||
      !content.length ||
      total > MAX_BYTES ||
      !new RegExp(`\\.${extension === "jpg" ? "jpe?g" : extension}$`, "i").test(
        file.name,
      )
    )
      throw new Error("Unsupported file");
    return {
      filename:
        file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "") ||
        `artwork.${extension}`,
      content,
      contentType: png ? "image/png" : jpg ? "image/jpeg" : "application/pdf",
    };
  });
}

function createHandler({
  createTransport = nodemailer.createTransport,
  env = process.env,
} = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ message: "Method not allowed." });
    }
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body))
      return res
        .status(400)
        .json({ message: "Please complete the inquiry form." });
    if (body.website)
      return res.status(400).json({ message: "Unable to submit this form." });
    const { name, email, message, inquiryType = "general" } = body;
    if (
      !text(name, 150) ||
      /[\r\n]/.test(name) ||
      !validEmail(email) ||
      !text(message, 10000) ||
      !["general", "quote", "trade"].includes(inquiryType)
    )
      return res.status(400).json({
        message: "Please provide a valid name, email address, and message.",
      });
    let attachments;
    try {
      attachments = readAttachments(body.attachments);
    } catch {
      return res.status(400).json({
        message:
          "Upload up to 3 PNG, JPG, or PDF files, totaling no more than 2 MB.",
      });
    }
    if (!env.EMAIL_USER || !env.EMAIL_PASS)
      return res.status(503).json({
        message:
          "The inquiry form is temporarily unavailable. Please email sales@dynamicvent.com.",
      });
    const transporter = createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      requireTLS: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
    });
    try {
      await transporter.sendMail({
        from: env.EMAIL_USER,
        to: "sales@dynamicvent.com",
        replyTo: email.trim(),
        subject: `${inquiryType === "trade" ? "Trade quote" : inquiryType === "quote" ? "Configured vent quote" : "Website inquiry"} from ${name.trim()}`,
        text: `Name: ${name.trim()}\nEmail: ${email.trim()}\nInquiry: ${inquiryType}\n\n${message.trim()}`,
        attachments,
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      return res.status(200).json({
        message:
          inquiryType === "general"
            ? "Thank you. Your inquiry has been sent to DynamicVent. We’ll reply by email to confirm pricing and next steps."
            : quoteConfirmation,
      });
    } catch (error) {
      // Record only controlled status fields, never raw SMTP errors or credentials.
      const response = typeof error.response === "string" ? error.response : "";
      const diagnostic = {
        code: [
          "EAUTH",
          "ETIMEDOUT",
          "EDNS",
          "ECONNECTION",
          "ESOCKET",
          "ETLS",
          "EENVELOPE",
          "EMESSAGE",
          "ESTREAM",
        ].includes(error.code)
          ? error.code
          : "UNKNOWN",
        smtpStatus: Number.isInteger(error.responseCode)
          ? error.responseCode
          : undefined,
        enhancedStatus: response.match(/\b[245]\.\d{1,3}\.\d{1,3}\b/)?.[0],
        category:
          /SmtpClientAuthentication.*disabled|SMTP.*AUTH.*disabled/i.test(
            response,
          )
            ? "SMTP_AUTH_DISABLED"
            : /basic authentication.*(?:disabled|blocked)|5\.7\.30/i.test(
                  response,
                )
              ? "BASIC_AUTH_BLOCKED"
              : error.code === "EAUTH"
                ? "AUTHENTICATION_REJECTED"
                : "TRANSPORT_ERROR",
      };
      console.error(
        "Contact email delivery failed.",
        JSON.stringify(diagnostic),
      );
      return res.status(502).json({
        message:
          "Your inquiry was not sent. Please try again or email sales@dynamicvent.com.",
      });
    } finally {
      if (typeof transporter.close === "function") transporter.close();
    }
  };
}
module.exports = { createHandler, readAttachments };
