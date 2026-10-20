const positive = (value, fallback) =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0
    ? Number(value)
    : fallback;

function createRateLimiter({
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = Date.now,
} = {}) {
  // Best effort: this Map belongs to one warm instance, resets on cold start,
  // and is not shared between concurrent instances or regions. Redis is optional.
  const entries = new Map();
  const windowSeconds = positive(env.RATE_LIMIT_WINDOW_SECONDS, 600);
  const max = positive(env.RATE_LIMIT_MAX, 5);
  function memoryHit(key, limit, seconds) {
    const time = Number(now());
    for (const [entryKey, entry] of entries) {
      if (entry.expires <= time) entries.delete(entryKey);
    }
    let entry = entries.get(key);
    if (!entry) {
      // Bound active keys as well as pruning expired ones. Eviction is fail-open.
      if (entries.size >= 10000) entries.delete(entries.keys().next().value);
      entry = { count: 0, expires: time + seconds * 1000 };
      entries.set(key, entry);
    }
    entry.count++;
    return {
      allowed: entry.count <= limit,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.expires - time) / 1000)),
    };
  }
  return {
    async hit(key) {
      const recipient = key.startsWith("recipient:");
      const limit = recipient ? 3 : max;
      const seconds = recipient ? 3600 : windowSeconds;
      if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
        try {
          const bucket = Math.floor(Number(now()) / (seconds * 1000));
          const redisKey = `dynamicvent:${key}:${bucket}`;
          const response = await fetchImpl(
            `${env.UPSTASH_REDIS_REST_URL.replace(/\/$/, "")}/pipeline`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify([
                ["INCR", redisKey],
                ["EXPIRE", redisKey, seconds],
              ]),
              signal: AbortSignal.timeout(3000),
            },
          );
          if (!response.ok) throw new Error("Backend unavailable");
          const results = await response.json();
          if (
            !Array.isArray(results) ||
            results.length !== 2 ||
            results.some((result) => result.error) ||
            !Number.isInteger(results[0]?.result) ||
            results[1]?.result !== 1
          )
            throw new Error("Invalid backend response");
          return {
            allowed: results[0].result <= limit,
            retryAfterSeconds: Math.max(
              1,
              seconds - (Math.floor(Number(now()) / 1000) % seconds),
            ),
          };
        } catch {
          console.error(JSON.stringify({ event: "rate_limit_backend_error" }));
        }
      }
      return memoryHit(key, limit, seconds);
    },
  };
}
module.exports = { createRateLimiter };
