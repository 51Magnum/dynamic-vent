const { test } = require("node:test");
const assert = require("node:assert/strict");
const replyTime = require("../src/data/reply-time.json");
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
function setup(sendMail = async () => {}, overrides = {}) {
  let config;
  const sent = [];
  const leads = [];
  let closed = false;
  const handler = createHandler({
    env: environment,
    leadLogger: async (record) => leads.push(record),
    ...overrides,
    createTransport(options) {
      config = options;
      return {
        close() {
          closed = true;
        },
        async sendMail(mail) {
          sent.push(mail);
          await sendMail(mail);
        },
      };
    },
  });
  return { handler, sent, leads, closed: () => closed, config: () => config };
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
    require("../src/data/quote-confirmation.json").replace(
      "{replyTime}",
      replyTime,
    ),
  );
  assert.equal(app.sent.length, 2);
  app.sent.reverse();
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

test("general inquiry sends an independent confirmation and records accurate lead metadata", async () => {
  const app = setup(undefined, {
    env: { ...environment, SALES_EMAIL: "team@example.com" },
    now: () => new Date("2026-10-20T12:00:00Z"),
  });
  const res = response();
  await app.handler(
    {
      method: "POST",
      body: {
        ...valid,
        inquiryType: "general",
        sourcePage: "/contact",
        phone: " +1 (208) 555-0100 ",
      },
    },
    res,
  );
  assert.deepEqual(
    [res.code, res.body.ok, res.body.internalSent, res.body.confirmationSent],
    [200, true, true, true],
  );
  const customer = app.sent.find((mail) => mail.to === valid.email);
  const internal = app.sent.find((mail) => mail.to === "team@example.com");
  assert.equal(customer.subject, "We received your DynamicVent inquiry");
  assert.equal(customer.replyTo, "team@example.com");
  assert.equal(customer.attachments, undefined);
  assert.equal(internal.replyTo, valid.email);
  assert.match(internal.text, /Customer confirmation sent: Yes/);
  assert.match(internal.text, /2026-10-20T12:00:00.000Z/);
  assert.ok(customer.text.includes(replyTime));
  assert.ok(res.body.message.includes(replyTime));
  assert.equal(app.leads.length, 1);
  assert.equal(app.leads[0].source, "contact");
  assert.equal(app.leads[0].phone, "+1 (208) 555-0100");
  assert.equal(app.leads[0].internalSent, true);
  assert.equal(app.leads[0].confirmationSent, true);
  assert.match(internal.text, new RegExp(app.leads[0].id));
  assert.equal(app.closed(), true);
});
test("confirmation truncates the submitted message, escapes HTML and lists filenames only", async () => {
  const app = setup();
  const res = response();
  const message =
    "<script>alert(1)</script> & \"hello\" 'world'\n\t" + "x".repeat(2100);
  await app.handler(
    {
      method: "POST",
      body: {
        ...valid,
        message,
        attachments: [
          {
            name: "logo.pdf",
            content: Buffer.from("%PDF-1.4 private artwork").toString("base64"),
          },
        ],
      },
    },
    res,
  );
  const mail = app.sent.find((mail) => mail.to === valid.email);
  assert.ok(mail.text.includes(message.slice(0, 2000) + "…"));
  assert.ok(!mail.text.includes(message));
  assert.match(mail.html, /&lt;script&gt;alert/);
  assert.match(mail.html, /<br>\n<br>\nName:/);
  assert.match(mail.html, /<br>\nAttachments:/);
  assert.doesNotMatch(mail.html, /white-space|<script>/);
  assert.match(mail.html, /&amp; &quot;hello&quot; &#39;world&#39;/);
  assert.match(mail.text, /logo.pdf/);
  assert.doesNotMatch(mail.text, /private artwork/);
  assert.match(mail.text, /No payment has been taken/);
  assert.equal(mail.attachments, undefined);
  assert.equal(app.leads[0].attachments[0].bytes, 24);
  assert.equal(app.leads[0].attachments[0].content, undefined);
});
test("either send can fail without preventing the other, with safe diagnostics", async () => {
  for (const failedRecipient of [valid.email, "sales@dynamicvent.com"]) {
    const records = [];
    const original = console.error;
    console.error = (line) => records.push(JSON.parse(line));
    try {
      const app = setup(async (mail) => {
        if (mail.to === failedRecipient) throw new Error("private details");
      });
      const res = response();
      await app.handler({ method: "POST", body: valid }, res);
      assert.equal(res.code, 200);
      assert.equal(app.sent.length, 2);
      assert.equal(
        res.body.internalSent,
        failedRecipient !== "sales@dynamicvent.com",
      );
      assert.equal(res.body.confirmationSent, failedRecipient !== valid.email);
      assert.equal(app.leads[0].internalSent, res.body.internalSent);
      assert.equal(app.leads[0].confirmationSent, res.body.confirmationSent);
      assert.ok(
        records.some(
          (record) =>
            record.event ===
            (res.body.internalSent
              ? "confirmation_send_failed"
              : "internal_notify_failed"),
        ),
      );
      assert.doesNotMatch(
        JSON.stringify(records),
        /private details|buyer@example.com/,
      );
      assert.equal(app.closed(), true);
    } finally {
      console.error = original;
    }
  }
});
test("honeypot returns success before validation, decoding, limiting, or SMTP", async () => {
  const original = console.log;
  const logs = [];
  console.log = (line) => logs.push(JSON.parse(line));
  try {
    const app = setup(undefined, {
      rateLimiter: {
        hit() {
          throw new Error("must not limit");
        },
      },
    });
    const res = response();
    await app.handler(
      { method: "POST", body: { website: "spam", attachments: "invalid" } },
      res,
    );
    assert.equal(res.code, 200);
    assert.deepEqual(
      [res.body.ok, res.body.internalSent, res.body.confirmationSent],
      [true, false, false],
    );
    assert.equal(app.sent.length, 0);
    assert.equal(app.leads.length, 0);
    assert.deepEqual(logs, [{ event: "spam_dropped", reason: "honeypot" }]);
  } finally {
    console.log = original;
  }
});
test("IP limits the sixth submission, hashes trusted IP precedence, and limits recipients separately", async () => {
  const app = setup();
  for (let i = 0; i < 6; i++) {
    const res = response();
    await app.handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "192.0.2.1, 192.0.2.2" },
        body: valid,
      },
      res,
    );
    assert.equal(res.code, i === 5 ? 429 : 200);
    if (i === 5) assert.ok(Number(res.headers["Retry-After"]) > 0);
    if (i === 3 || i === 4) assert.equal(res.body.confirmationSent, false);
  }
  assert.equal(app.sent.filter((mail) => mail.to === valid.email).length, 3);
  assert.equal(
    app.sent.filter((mail) => mail.to === "sales@dynamicvent.com").length,
    5,
  );
  const another = response();
  await app.handler(
    { method: "POST", headers: { "x-real-ip": "192.0.2.3" }, body: valid },
    another,
  );
  assert.equal(another.code, 200);
  assert.equal(another.body.confirmationSent, false);
  const keys = [];
  const capture = setup(undefined, {
    rateLimiter: {
      async hit(key) {
        keys.push(key);
        return { allowed: true };
      },
    },
  });
  await capture.handler(
    {
      method: "POST",
      headers: { "x-forwarded-for": "192.0.2.1, 192.0.2.2" },
      body: valid,
    },
    response(),
  );
  assert.match(keys[0], /^ip:[a-f0-9]{64}$/);
  assert.equal(
    keys[0],
    "ip:" +
      require("node:crypto")
        .createHash("sha256")
        .update("192.0.2.1")
        .digest("hex"),
  );
  assert.match(keys[1], /^recipient:[a-f0-9]{64}$/);
});
test("validation trims strings, strips message controls, rejects bad phones and normalizes source pages", async () => {
  const app = setup();
  const res = response();
  await app.handler(
    {
      method: "POST",
      body: {
        ...valid,
        name: " Test Buyer ",
        email: " buyer@example.com ",
        message: "  hello\u0000\u0007\n\tworld  ",
        sourcePage: "/arbitrary",
      },
    },
    res,
  );
  assert.equal(res.code, 200);
  assert.equal(app.leads[0].message, "hello\n\tworld");
  assert.equal(app.leads[0].sourcePage, "/contact");
  for (const phone of ["123ext", "1".repeat(31), 123]) {
    const bad = response();
    await setup().handler({ method: "POST", body: { ...valid, phone } }, bad);
    assert.equal(bad.code, 400);
  }
  const bad = response();
  await setup().handler(
    { method: "POST", body: { ...valid, name: "Buyer\n" } },
    bad,
  );
  assert.equal(bad.code, 400);
});
test("configured sales address is used in safe failure and rate-limit messages", async () => {
  const app = setup(
    async () => {
      throw new Error("SMTP failed");
    },
    { env: { ...environment, SALES_EMAIL: "team@example.com" } },
  );
  const res = response();
  await app.handler({ method: "POST", body: valid }, res);
  assert.match(res.body.message, /team@example.com/);
  assert.equal(app.leads.length, 1);
});

test("accepted submissions emit exactly one real lead event even when webhook fails", async () => {
  const { createLeadLogger } = require("../lib/lead-log.cjs");
  const originalLog = console.log;
  const originalError = console.error;
  const logs = [];
  const errors = [];
  console.log = (line) => logs.push(JSON.parse(line));
  console.error = (line) => errors.push(JSON.parse(line));
  try {
    const leadLogger = createLeadLogger({
      env: { LEAD_WEBHOOK_URL: "https://hooks.example/leads" },
      fetchImpl: async () => {
        throw new Error("private backend");
      },
    });
    const app = setup(undefined, { leadLogger });
    const res = response();
    await app.handler(
      {
        method: "POST",
        headers: { "x-real-ip": "192.0.2.99" },
        body: { ...valid, sourcePage: "/trade" },
      },
      res,
    );
    assert.equal(res.code, 200);
    assert.equal(logs.length, 1);
    assert.equal(logs[0].event, "lead");
    assert.equal(logs[0].sourcePage, "/trade");
    assert.equal(logs[0].internalSent, true);
    assert.equal(logs[0].confirmationSent, true);
    assert.doesNotMatch(JSON.stringify(logs), /192.0.2.99|remoteAddress/);
    assert.deepEqual(errors, [
      { event: "lead_webhook_failed", leadId: logs[0].id },
    ]);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
});

test("real PDF attachment survives validation and MIME serialization byte for byte", async () => {
  const fs = require("node:fs");
  const nodemailer = require("nodemailer");
  const content = fs.readFileSync(
    require("node:path").join(__dirname, "fixtures", "delivery-test.pdf"),
  );
  const mimeMessages = [];
  const handler = createHandler({
    env: environment,
    leadLogger: async () => {},
    createTransport() {
      const transport = nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
        newline: "windows",
      });
      return {
        async sendMail(mail) {
          const result = await transport.sendMail(mail);
          mimeMessages.push(result.message.toString());
        },
        close() {
          transport.close();
        },
      };
    },
  });
  const res = response();
  await handler(
    {
      method: "POST",
      body: {
        ...valid,
        attachments: [
          { name: "delivery-test.pdf", content: content.toString("base64") },
        ],
      },
    },
    res,
  );
  assert.equal(res.code, 200);
  assert.doesNotMatch(mimeMessages[0], /Content-Disposition: attachment/);
  const attachmentPart = mimeMessages[1].split(
    "Content-Disposition: attachment; filename=delivery-test.pdf",
  )[1];
  assert.ok(attachmentPart);
  const encoded = attachmentPart.split(/\r?\n\r?\n/)[1].split(/\r?\n--/)[0];
  const recovered = Buffer.from(encoded.replace(/\s/g, ""), "base64");
  assert.deepEqual(recovered, content);
  assert.match(recovered.toString(), /%%EOF/);
});

const catalog = require("../src/data/catalog.json");
const { money } = require("../lib/quote-estimate.cjs");
const expectedQuoteTotal = catalog.ventPrices["6x14"] * 2 * 3 + catalog.templatePrices["6x14"];
const validQuote = {
  size: "6x14",
  pattern: "Square-2",
  custom: false,
  customNotes: "",
  finishType: "Painted (standard)",
  color: "Antique Pewter",
  slider: true,
  quantity: 3,
  template: true,
  displayedTotal: expectedQuoteTotal,
};
test("structured quote is recomputed, emailed to both recipients and logged", async () => {
  const app = setup();
  const res = response();
  await app.handler(
    {
      method: "POST",
      body: {
        ...valid,
        inquiryType: "quote",
        sourcePage: "/contact",
        quote: validQuote,
        postalCode: "83651",
        phone: "+1 (208) 555-0100",
      },
    },
    res,
  );
  assert.equal(res.code, 200);
  const internal = app.sent.find((mail) => mail.to === "sales@dynamicvent.com");
  const confirmation = app.sent.find((mail) => mail.to === valid.email);
  assert.ok(
    internal.text.includes(
      `Server estimated subtotal: ${money(expectedQuoteTotal)}`,
    ),
  );
  assert.ok(
    internal.text.includes(
      `Displayed estimated subtotal: ${money(expectedQuoteTotal)}`,
    ),
  );
  assert.match(internal.html, /<table/);
  assert.match(internal.html, /Square 2/);
  assert.doesNotMatch(internal.text, /differed from server/);
  assert.ok(
    confirmation.text.includes(
      `Estimated subtotal (shipping and tax TBD): ${money(expectedQuoteTotal)}`,
    ),
  );
  assert.equal(app.leads[0].source, "quote");
  assert.equal(app.leads[0].quote.serverEstimate, expectedQuoteTotal);
  assert.equal(app.leads[0].postalCode, "83651");
});
test("tampered displayed totals are flagged without changing the server estimate", async () => {
  const app = setup();
  const res = response();
  await app.handler(
    {
      method: "POST",
      body: {
        ...valid,
        inquiryType: "quote",
        quote: { ...validQuote, displayedTotal: 1 },
        postalCode: "83651",
      },
    },
    res,
  );
  assert.equal(res.code, 200);
  const mail = app.sent.find((mail) => mail.to === "sales@dynamicvent.com");
  assert.match(
    mail.text,
    /Displayed estimate differed from server estimate; verify before quoting/,
  );
  assert.ok(
    mail.text.includes(
      `Server estimated subtotal: ${money(expectedQuoteTotal)}`,
    ),
  );
  assert.match(mail.text, /Displayed estimated subtotal: \$1.00/);
});
test("invalid quote fields and ZIP are rejected before SMTP", async () => {
  for (const [field, value] of [
    ["size", "99x99"],
    ["size", "__proto__"],
    ["pattern", "unknown"],
    ["pattern", "custom"],
    ["color", "<script>"],
    ["finishType", "unknown"],
    ["template", "unknown"],
    ["quantity", 1.5],
    ["quantity", 100],
    ["quantity", 0],
    ["quantity", "3"],
    ["slider", "true"],
    ["custom", "true"],
    ["customNotes", "x".repeat(501)],
    ["displayedTotal", null],
  ]) {
    const app = setup();
    const res = response();
    await app.handler(
      {
        method: "POST",
        body: {
          ...valid,
          inquiryType: "quote",
          quote: { ...validQuote, [field]: value },
          postalCode: "83651",
        },
      },
      res,
    );
    assert.equal(res.code, 400, field);
    assert.equal(app.sent.length, 0);
    assert.ok(res.body.message.includes("valid"));
  }
  for (const postalCode of [undefined, "", "12", "<bad>"]) {
    const app = setup();
    const res = response();
    await app.handler(
      {
        method: "POST",
        body: { ...valid, inquiryType: "quote", quote: validQuote, postalCode },
      },
      res,
    );
    assert.equal(res.code, 400);
    assert.equal(res.body.field, "postalCode");
    assert.equal(app.sent.length, 0);
  }
});
test("custom quote notes are escaped in HTML and retained in plain text", async () => {
  const app = setup();
  const res = response();
  const notes = "<script>alert(1)</script>\nWelcome Home";
  await app.handler(
    {
      method: "POST",
      body: {
        ...valid,
        inquiryType: "quote",
        quote: {
          ...validQuote,
          custom: true,
          pattern: "custom",
          customNotes: notes,
        },
        postalCode: "V6B 1A1",
      },
    },
    res,
  );
  assert.equal(res.code, 200);
  for (const mail of app.sent) {
    assert.ok(mail.text.includes(notes));
    assert.doesNotMatch(mail.html, /<script>/);
    assert.match(mail.html, /&lt;script&gt;/);
  }
});


test("both emails charge the selected size template once at full price", async () => {
  for (const [size, price] of Object.entries(catalog.templatePrices)) {
    const app = setup();
    const res = response();
    const total = catalog.ventPrices[size] * 2 * 10 + price;
    await app.handler({method:"POST", body:{...valid, inquiryType:"quote", postalCode:"83651", quote:{...validQuote,size,quantity:10,displayedTotal:total}}}, res);
    assert.equal(res.code, 200);
    assert.equal(app.sent.length, 2);
    for (const mail of app.sent) {
      assert.ok(mail.text.includes(`Installation template: Yes ($${price.toFixed(2)})`));
      assert.ok(mail.html.includes(`Yes ($${price.toFixed(2)})`));
      assert.ok(mail.text.includes(money(total)));
    }
    assert.equal(app.leads[0].quote.serverEstimate,total);
  }
});


test("Trade emails use server-calculated tiers and discounted slider prices", async () => {
  for (const [quantity, percent] of [[9,0],[10,10],[25,15],[50,20],[100,25]]) {
    for (const slider of [false,true]) {
      const app = setup();
      const res = response();
      await app.handler({method:"POST",body:{...valid,inquiryType:"trade",tradePricing:{size:"4x8",quantity,slider,discountPercent:99,displayedTotal:1}}},res);
      assert.equal(res.code,200);
      const total = Math.round(catalog.ventPrices["4x8"]*(100-percent))/100*(slider?2:1)*quantity;
      for (const mail of app.sent) {
        assert.ok(mail.text.includes(`Trade discount (vents only): ${percent}%`));
        assert.ok(mail.text.includes(`Estimated standard-vent total: ${money(total)}`));
        assert.ok(mail.text.includes("Templates are not discounted."));
      }
    }
  }
});
test("invalid trade pricing is rejected and retail quotes cannot claim a trade tier", async () => {
  for (const change of [{size:"__proto__"},{quantity:0},{quantity:10001},{quantity:"25"},{slider:"true"}]) {
    const app=setup(),res=response();
    await app.handler({method:"POST",body:{...valid,inquiryType:"trade",tradePricing:{size:"4x8",quantity:25,slider:false,...change}}},res);
    assert.equal(res.code,400);
    assert.equal(app.sent.length,0);
  }
  const app=setup(),res=response();
  await app.handler({method:"POST",body:{...valid,inquiryType:"quote",postalCode:"83651",quote:{...validQuote,quantity:25,trade:true,displayedTotal:catalog.ventPrices["6x14"]*2*25+catalog.templatePrices["6x14"]}}},res);
  assert.equal(res.code,200);
  assert.equal(app.leads[0].quote.serverEstimate,catalog.ventPrices["6x14"]*2*25+catalog.templatePrices["6x14"]);
});
