const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHandler } = require("../lib/contact-handler.cjs");
const environment = {
  EMAIL_USER: "test@example.com",
  EMAIL_PASS: "fixture-only",
};
const valid = {
  name: "Test Buyer",
  email: "buyer@example.com",
  message: "Please quote 12 vents.",
  inquiryType: "trade",
};
function response() {
  return {
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
function setup(sendMail = async () => {}) {
  let config;
  const sent = [];
  const handler = createHandler({
    env: environment,
    createTransport(options) {
      config = options;
      return {
        async sendMail(mail) {
          sent.push(mail);
          await sendMail(mail);
        },
      };
    },
  });
  return { handler, sent, config: () => config };
}
test("trade quote delivers configuration and safe artwork with buyer reply-to", async () => {
  const app = setup();
  const res = response();
  const content = Buffer.from("%PDF-1.4\nartwork");
  await app.handler(
    {
      method: "POST",
      body: {
        ...valid,
        attachments: [
          { name: "logo.pdf", content: content.toString("base64") },
        ],
      },
    },
    res,
  );
  assert.equal(res.code, 200);
  assert.equal(
    res.body.message,
    require("../src/data/quote-confirmation.json"),
  );
  assert.equal(app.sent.length, 1);
  assert.equal(app.sent[0].to, "sales@dynamicvent.com");
  assert.equal(app.sent[0].replyTo, "buyer@example.com");
  assert.match(app.sent[0].text, /12 vents/);
  assert.deepEqual(app.sent[0].attachments[0].content, content);
  assert.equal(app.sent[0].disableFileAccess, true);
  assert.equal(app.config().requireTLS, true);
});
test("SMTP errors never reveal credentials or transport details to customers", async () => {
  const app = setup(async () => {
    throw new Error("sensitive SMTP credential detail");
  });
  const res = response();
  await app.handler({ method: "POST", body: valid }, res);
  assert.equal(res.code, 502);
  assert.doesNotMatch(JSON.stringify(res.body), /sensitive|credential/);
});
test("invalid identity, header injection, empty messages and bot submissions do not send mail", async () => {
  for (const change of [
    { name: "Buyer\r\nBcc: other@example.com" },
    { email: "not-email" },
    { message: "  " },
    { website: "spam" },
    { inquiryType: "arbitrary" },
  ]) {
    const app = setup();
    const res = response();
    await app.handler({ method: "POST", body: { ...valid, ...change } }, res);
    assert.equal(res.code, 400);
    assert.equal(app.sent.length, 0);
  }
});
test("invalid, disguised and oversized artwork is rejected before sending", async () => {
  const good = {
    name: "logo.pdf",
    content: Buffer.from("%PDF-1.4 artwork").toString("base64"),
  };
  for (const attachments of [
    [
      {
        name: "logo.pdf",
        content: Buffer.from("not a pdf").toString("base64"),
      },
    ],
    [{ ...good, name: "logo.exe" }],
    [good, good, good, good],
    [
      {
        ...good,
        content: Buffer.alloc(2 * 1024 * 1024 + 1).toString("base64"),
      },
    ],
    [{ ...good, content: "%%%" }],
  ]) {
    const app = setup();
    const res = response();
    await app.handler({ method: "POST", body: { ...valid, attachments } }, res);
    assert.equal(res.code, 400);
    assert.equal(app.sent.length, 0);
  }
});
test("missing email configuration fails clearly and unsupported methods cannot send", async () => {
  const handler = createHandler({ env: {} });
  const res = response();
  await handler({ method: "POST", body: valid }, res);
  assert.equal(res.code, 503);
  const other = response();
  await handler({ method: "GET" }, other);
  assert.equal(other.code, 405);
  assert.equal(other.headers.Allow, "POST");
});

test("diagnostics identify disabled SMTP without logging the provider response or credentials", async () => {
  const records = [];
  const original = console.error;
  console.error = (...args) => records.push(args);
  try {
    const app = setup(async () => {
      const error = new Error("private password content");
      error.code = "EAUTH";
      error.responseCode = 535;
      error.response =
        "535 5.7.139 Authentication unsuccessful, SmtpClientAuthentication is disabled for the Tenant. private password content";
      throw error;
    });
    const res = response();
    await app.handler({ method: "POST", body: valid }, res);
    const logged = JSON.stringify(records);
    assert.match(logged, /SMTP_AUTH_DISABLED/);
    assert.match(logged, /535/);
    assert.doesNotMatch(
      logged,
      /private password content|Authentication unsuccessful/,
    );
    assert.equal(res.code, 502);
  } finally {
    console.error = original;
  }
});
