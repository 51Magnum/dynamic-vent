const nodemailer = require("nodemailer");
const { createHash, randomUUID } = require("node:crypto");
const { createRateLimiter } = require("./rate-limit.cjs");
const { createLeadLogger } = require("./lead-log.cjs");
const { escapeHtml } = require("./escape-html.cjs");
const {
  estimate,
  formatQuote,
  money,
  quoteRows,
  formatTradePricing,
} = require("./quote-estimate.cjs");
const { validateQuote } = require("./quote-validation.cjs");
const replyTime = require("../src/data/reply-time.json");
const quoteTemplate = require("../src/data/quote-confirmation.json");
const quoteConfirmation = quoteTemplate.replace("{replyTime}", replyTime);
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
        file.name.trim(),
      )
    )
      throw new Error("Unsupported file");
    return {
      filename:
        file.name
          .trim()
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/^\.+/, "") || `artwork.${extension}`,
      content,
      contentType: png ? "image/png" : jpg ? "image/jpeg" : "application/pdf",
    };
  });
}

function diagnostic(error) {
  // Controlled fields only: never log raw provider responses or credentials.
  const response = typeof error?.response === "string" ? error.response : "";
  return {
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
    ].includes(error?.code)
      ? error.code
      : "UNKNOWN",
    smtpStatus: Number.isInteger(error?.responseCode)
      ? error.responseCode
      : undefined,
    enhancedStatus: response.match(/\b[245]\.\d{1,3}\.\d{1,3}\b/)?.[0],
    category: /SmtpClientAuthentication.*disabled|SMTP.*AUTH.*disabled/i.test(
      response,
    )
      ? "SMTP_AUTH_DISABLED"
      : /basic authentication.*(?:disabled|blocked)|5\.7\.30/i.test(response)
        ? "BASIC_AUTH_BLOCKED"
        : error?.code === "EAUTH"
          ? "AUTHENTICATION_REJECTED"
          : "TRANSPORT_ERROR",
  };
}
const trim = (value) => (typeof value === "string" ? value.trim() : value);
const hash = (value) => createHash("sha256").update(value).digest("hex");
function clientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const real = req.headers?.["x-real-ip"];
  return (
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      ?.split(",")[0]
      .trim() ||
    (Array.isArray(real) ? real[0] : real)?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}
function createHandler({
  createTransport = nodemailer.createTransport,
  env = process.env,
  rateLimiter = createRateLimiter({ env }),
  leadLogger = createLeadLogger({ env }),
  now = () => new Date(),
} = {}) {
  const SALES_EMAIL = validEmail(trim(env.SALES_EMAIL))
    ? trim(env.SALES_EMAIL)
    : "sales@dynamicvent.com";
  const successMessage = (kind) =>
    kind === "general"
      ? `Thank you. Your inquiry has been sent to DynamicVent. We’ll reply by email ${replyTime} to confirm pricing and next steps.`
      : quoteConfirmation.replaceAll("sales@dynamicvent.com", SALES_EMAIL);
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
    if (body.website && trim(body.website)) {
      console.log(
        JSON.stringify({ event: "spam_dropped", reason: "honeypot" }),
      );
      return res.status(200).json({
        ok: true,
        message: successMessage(body.inquiryType || "general"),
        internalSent: false,
        confirmationSent: false,
      });
    }
    const ipLimit = await rateLimiter.hit(`ip:${hash(clientIp(req))}`);
    if (!ipLimit.allowed) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      console.log(JSON.stringify({ event: "rate_limited" }));
      return res.status(429).json({
        message: `Too many submissions. Please wait a few minutes or email ${SALES_EMAIL}.`,
      });
    }
    const name = trim(body.name);
    const email = trim(body.email);
    const inquiryType = trim(body.inquiryType ?? "general");
    const message =
      typeof body.message === "string"
        ? body.message.replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "").trim()
        : body.message;
    const phone = trim(body.phone);
    const sourcePage = ["/contact", "/trade", "/shop"].includes(
      trim(body.sourcePage),
    )
      ? trim(body.sourcePage)
      : "/contact";
    if (
      !text(name, 150) ||
      /[\r\n]/.test(body.name) ||
      !validEmail(email) ||
      !text(message, 10000) ||
      !["general", "quote", "trade"].includes(inquiryType) ||
      (phone !== undefined &&
        (typeof phone !== "string" ||
          phone.length > 30 ||
          !/^[0-9 +().-]*$/.test(phone)))
    )
      return res.status(400).json({
        message: "Please provide a valid name, email address, and message.",
      });
    const postalCode = trim(body.postalCode);
    let quote;
    let quoteEstimate;
    if (inquiryType === "quote") {
      try {
        quote = validateQuote(body.quote, postalCode);
        quoteEstimate = estimate(quote);
      } catch (error) {
        return res.status(400).json({
          message:
            error.field === "postalCode"
              ? "Please provide a valid delivery ZIP / postal code (3–20 letters, digits, spaces or hyphens)."
              : error.message,
          field: error.field,
        });
      }
    }
    let tradeConfiguration = "";
    if (inquiryType === "trade" && body.tradePricing !== undefined) {
      try {
        const selection = body.tradePricing;
        if (
          !selection || typeof selection !== "object" ||
          Array.isArray(selection) || typeof selection.slider !== "boolean"
        ) throw new Error("Invalid trade selection");
        tradeConfiguration = formatTradePricing({
          size: selection.size, quantity: selection.quantity, slider: selection.slider,
        });
      } catch {
        return res.status(400).json({
          message: "Please provide a valid trade size, quantity, and shutoff slider option.",
        });
      }
    }
    const configuration = quote ? formatQuote(quote) : "";
    const estimateMismatch =
      quote &&
      Math.abs(quote.displayedTotal - quoteEstimate.total) > 0.010000001;
    const estimateAudit = quote
      ? `\nServer estimated subtotal: ${money(quoteEstimate.total)}\nDisplayed estimated subtotal: ${money(quote.displayedTotal)}${estimateMismatch ? "\n⚠ Displayed estimate differed from server estimate; verify before quoting." : ""}\nDelivery ZIP / postal code: ${postalCode}`
      : "";
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
        message: `The inquiry form is temporarily unavailable. Please email ${SALES_EMAIL}.`,
      });

    const leadId = randomUUID();
    const timestamp = new Date(now()).toISOString();
    const source = inquiryType === "general" ? "contact" : inquiryType;
    const recipientLimit = await rateLimiter.hit(
      `recipient:${hash(email.toLowerCase())}`,
    );
    let transporter;
    let internalSent = false;
    let confirmationSent = false;
    const report = (event, error) =>
      console.error(JSON.stringify({ event, leadId, ...diagnostic(error) }));
    try {
      transporter = createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        requireTLS: true,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
      });
      const safeMail = {
        from: env.EMAIL_USER,
        disableFileAccess: true,
        disableUrlAccess: true,
      };
      // Attempt the confirmation first so the internal header records its final
      // status. Each send has its own catch: failure never prevents the other.
      if (recipientLimit.allowed) {
        const summary =
          message.length > 2000 ? `${message.slice(0, 2000)}…` : message;
        const confirmationText = `Thank you, ${name}. We received your DynamicVent ${inquiryType === "general" ? "inquiry" : "quote request"}.

Name: ${name}
Inquiry type: ${inquiryType}
${phone ? `Phone: ${phone}\n` : ""}Your submitted details:
${quote ? configuration.replace("Estimated subtotal:", "Estimated subtotal (shipping and tax TBD):") + "\nDelivery ZIP / postal code: " + postalCode + "\n\n" : ""}${summary}

Attachments: ${attachments.length ? attachments.map((file) => file.filename).join(", ") : "None"}

We’ll reply ${replyTime}.
${inquiryType === "general" ? "" : "No payment has been taken. Your order is confirmed only after you approve a final quote.\n"}
Reply to this email or email ${SALES_EMAIL}.`;
        try {
          await transporter.sendMail({
            ...safeMail,
            to: email,
            replyTo: SALES_EMAIL,
            subject:
              inquiryType === "general"
                ? "We received your DynamicVent inquiry"
                : "We received your DynamicVent quote request",
            text: confirmationText,
            // Outlook can collapse newlines even with white-space:pre-wrap.
            // Escape all content first, then add explicit email-safe line breaks.
            html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:22px">${escapeHtml(confirmationText).replace(/\r?\n/g, "<br>\n")}</div>`,
          });
          confirmationSent = true;
        } catch (error) {
          report("confirmation_send_failed", error);
        }
      }
      try {
        await transporter.sendMail({
          ...safeMail,
          to: SALES_EMAIL,
          replyTo: email,
          subject: `${inquiryType === "trade" ? "Trade quote" : inquiryType === "quote" ? "Configured vent quote" : "Website inquiry"} from ${name}`,
          text: `Lead ID: ${leadId}\nSource: ${source}\nSource page: ${sourcePage}\nTimestamp: ${timestamp}\nCustomer confirmation sent: ${confirmationSent ? "Yes" : "No"}\n\nName: ${name}\nEmail: ${email}\n${phone ? `Phone: ${phone}\n` : ""}Inquiry: ${inquiryType}\n\n${quote ? "Vent configuration:\n" + configuration + estimateAudit + "\n\nSubmitted details:\n" : ""}${tradeConfiguration ? "Trade pricing:\n" + tradeConfiguration + "\n\n" : ""}${message}`,
          ...(quote
            ? {
                html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:22px"><p>${escapeHtml(`Lead ID: ${leadId} | Source: ${source} | Source page: ${sourcePage} | Timestamp: ${timestamp} | Customer confirmation sent: ${confirmationSent ? "Yes" : "No"}`)}</p><h2>Vent configuration</h2><table role="presentation" cellpadding="6">${quoteRows(
                  quote,
                )
                  .map(
                    ([label, value]) =>
                      `<tr><th align="left" valign="top">${escapeHtml(label)}</th><td>${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`,
                  )
                  .join(
                    "",
                  )}</table><p>${escapeHtml(estimateAudit).replace(/\n/g, "<br>")}</p><p>${escapeHtml(`Name: ${name}\nEmail: ${email}\n${phone ? `Phone: ${phone}\n` : ""}\n${message}`).replace(/\n/g, "<br>")}</p></div>`,
              }
            : {}),
          attachments,
        });
        internalSent = true;
      } catch (error) {
        report("internal_notify_failed", error);
      }
    } catch (error) {
      // Synchronous transporter setup errors affect both attempted deliveries.
      report("internal_notify_failed", error);
      report("confirmation_send_failed", error);
    } finally {
      try {
        if (typeof transporter?.close === "function") transporter.close();
      } catch {
        console.error(
          JSON.stringify({ event: "transport_close_failed", leadId }),
        );
      }
    }
    const record = {
      id: leadId,
      timestamp,
      source,
      sourcePage,
      name,
      email,
      ...(phone ? { phone } : {}),
      message,
      ...(quote
        ? {
            quote: { ...quote, serverEstimate: quoteEstimate.total },
            postalCode,
          }
        : {}),
      attachments: attachments.map((file) => ({
        filename: file.filename,
        bytes: file.content.length,
      })),
      internalSent,
      confirmationSent,
    };
    try {
      await leadLogger(record);
    } catch {
      console.error(JSON.stringify({ event: "lead_log_failed", leadId }));
    }
    if (internalSent || confirmationSent)
      return res.status(200).json({
        ok: true,
        message: successMessage(inquiryType),
        internalSent,
        confirmationSent,
      });
    return res.status(502).json({
      message: `Your inquiry was not sent. Please try again or email ${SALES_EMAIL}.`,
    });
  };
}
module.exports = { createHandler, readAttachments };
