const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createRateLimiter } = require("../lib/rate-limit.cjs");

test("memory windows isolate keys, expire, prune old entries and honor overrides", async () => {
  let time = 0;
  const limiter = createRateLimiter({
    env: { RATE_LIMIT_MAX: "2", RATE_LIMIT_WINDOW_SECONDS: "10" },
    now: () => time,
  });
  assert.equal((await limiter.hit("ip:a")).allowed, true);
  assert.equal((await limiter.hit("ip:a")).allowed, true);
  assert.deepEqual(await limiter.hit("ip:a"), {
    allowed: false,
    retryAfterSeconds: 10,
  });
  assert.equal((await limiter.hit("ip:b")).allowed, true);
  time = 10001;
  assert.equal((await limiter.hit("ip:a")).allowed, true);
  // The expired b entry is pruned even when a different key triggers cleanup.
  assert.equal((await limiter.hit("ip:b")).allowed, true);
  assert.equal((await limiter.hit("ip:b")).allowed, true);
  assert.equal((await limiter.hit("ip:b")).allowed, false);
});
test("recipient cap stays at three per hour regardless of IP overrides", async () => {
  let time = 0;
  const limiter = createRateLimiter({
    env: { RATE_LIMIT_MAX: "100" },
    now: () => time,
  });
  for (let i = 0; i < 4; i++)
    assert.equal((await limiter.hit("recipient:a")).allowed, i < 3);
  time = 3600000;
  assert.equal((await limiter.hit("recipient:a")).allowed, true);
});
test("optional Upstash uses authenticated INCR and EXPIRE pipeline", async () => {
  const calls = [];
  const limiter = createRateLimiter({
    env: {
      UPSTASH_REDIS_REST_URL: "https://redis.example/",
      UPSTASH_REDIS_REST_TOKEN: "test-only",
    },
    now: () => 1000,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => [{ result: 6 }, { result: 1 }] };
    },
  });
  assert.deepEqual(await limiter.hit("ip:hash"), {
    allowed: false,
    retryAfterSeconds: 599,
  });
  assert.equal(calls[0].url, "https://redis.example/pipeline");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-only");
  assert.deepEqual(JSON.parse(calls[0].options.body), [
    ["INCR", "dynamicvent:ip:hash:0"],
    ["EXPIRE", "dynamicvent:ip:hash:0", 600],
  ]);
  assert.ok(calls[0].options.signal);
});
test("backend failures fail open to memory without revealing backend details", async () => {
  const original = console.error;
  const logs = [];
  console.error = (line) => logs.push(JSON.parse(line));
  try {
    const limiter = createRateLimiter({
      env: {
        RATE_LIMIT_MAX: "1",
        UPSTASH_REDIS_REST_URL: "https://redis.example",
        UPSTASH_REDIS_REST_TOKEN: "test-only",
      },
      fetchImpl: async () => {
        throw new Error("private backend details");
      },
    });
    assert.equal((await limiter.hit("ip:a")).allowed, true);
    assert.equal((await limiter.hit("ip:a")).allowed, false);
    assert.deepEqual(logs, [
      { event: "rate_limit_backend_error" },
      { event: "rate_limit_backend_error" },
    ]);
  } finally {
    console.error = original;
  }
});
