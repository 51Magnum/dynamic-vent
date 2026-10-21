const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createLeadLogger } = require("../lib/lead-log.cjs");
const record = {
  id: "test-lead",
  timestamp: "2026-10-20T12:00:00Z",
  source: "contact",
  sourcePage: "/contact",
  name: "Test Buyer",
  email: "buyer@example.com",
  message: "Quote please",
  attachments: [{ filename: "logo.pdf", bytes: 10 }],
  internalSent: true,
  confirmationSent: false,
};

test("one structured lead event and an optional authenticated webhook share the record", async () => {
  const original = console.log;
  const logs = [];
  const calls = [];
  console.log = (line) => logs.push(JSON.parse(line));
  try {
    const logger = createLeadLogger({
      env: {
        LEAD_WEBHOOK_URL: "https://hooks.example/leads",
        LEAD_WEBHOOK_SECRET: "test-only",
      },
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return { ok: true };
      },
    });
    await logger(record);
    assert.deepEqual(logs, [{ event: "lead", ...record }]);
    assert.equal(calls[0].options.headers["X-Lead-Secret"], "test-only");
    assert.deepEqual(JSON.parse(calls[0].options.body), record);
    assert.ok(calls[0].options.signal);
    assert.equal(calls.length, 1);
  } finally {
    console.log = original;
  }
});
test("webhook errors and timeouts never reject and log only the lead id", async () => {
  const originalError = console.error;
  const originalLog = console.log;
  const errors = [];
  console.error = (line) => errors.push(JSON.parse(line));
  console.log = () => {};
  try {
    await createLeadLogger({
      env: { LEAD_WEBHOOK_URL: "https://hooks.example/leads" },
      fetchImpl: async () => {
        throw new Error("private information");
      },
    })(record);
    const start = Date.now();
    await createLeadLogger({
      env: { LEAD_WEBHOOK_URL: "https://hooks.example/leads" },
      fetchImpl: () => new Promise(() => {}),
    })(record);
    assert.ok(Date.now() - start < 3500);
    assert.deepEqual(errors, [
      { event: "lead_webhook_failed", leadId: record.id },
      { event: "lead_webhook_failed", leadId: record.id },
    ]);
  } finally {
    console.error = originalError;
    console.log = originalLog;
  }
});

test("default path logs one lead without contacting a webhook", async () => {
  const original = console.log;
  const logs = [];
  let requests = 0;
  console.log = (line) => logs.push(JSON.parse(line));
  try {
    await createLeadLogger({
      env: {},
      fetchImpl: async () => {
        requests++;
        throw new Error("must stay disabled");
      },
    })(record);
    assert.equal(requests, 0);
    assert.deepEqual(logs, [{ event: "lead", ...record }]);
  } finally {
    console.log = original;
  }
});
