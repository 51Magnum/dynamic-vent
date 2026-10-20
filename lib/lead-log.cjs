function createLeadLogger({
  env = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  // Add future sinks here; delivery and request handling do not need to change.
  const sinks = [
    (record) => console.log(JSON.stringify({ event: "lead", ...record })),
  ];
  if (env.LEAD_WEBHOOK_URL)
    sinks.push(async (record) => {
      const controller = new AbortController();
      let timer;
      try {
        // Race as well as abort so an unresponsive backend cannot hold the request.
        await Promise.race([
          (async () => {
            const response = await fetchImpl(env.LEAD_WEBHOOK_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Lead-Secret": env.LEAD_WEBHOOK_SECRET || "",
              },
              body: JSON.stringify(record),
              signal: controller.signal,
            });
            if (!response.ok) throw new Error("Webhook unavailable");
            // Apps Script cannot set an HTTP error status; its JSON result matters.
            if (
              new URL(env.LEAD_WEBHOOK_URL).hostname === "script.google.com"
            ) {
              const result = await response.json();
              if (result.ok !== true) throw new Error("Webhook rejected lead");
            }
          })(),
          new Promise((_, reject) => {
            timer = setTimeout(() => {
              controller.abort();
              reject(new Error("Webhook timeout"));
            }, 3000);
          }),
        ]);
      } catch {
        console.error(
          JSON.stringify({ event: "lead_webhook_failed", leadId: record.id }),
        );
      } finally {
        clearTimeout(timer);
      }
    });
  return async (record) => {
    await Promise.allSettled(
      sinks.map((sink) => Promise.resolve().then(() => sink(record))),
    );
  };
}
module.exports = { createLeadLogger };
