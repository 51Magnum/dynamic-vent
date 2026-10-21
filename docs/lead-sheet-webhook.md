# Optional private Google Sheet lead archive

> **Privacy prerequisite:** Do not set LEAD_WEBHOOK_URL in Production until the /privacy page is live and lists Google Sheets.
> Leave the Production variable unset. Until then, configure and test this sink
> only in Preview, using an owner-authorized test submission.

This sink is disabled unless `LEAD_WEBHOOK_URL` is set. Email remains the primary
record. Nothing here creates a paid service. Keep the spreadsheet private.

1. Create a private Google Sheet. Add a tab named `Leads`. Row 1 column order:
   ID, Timestamp, Source, Source page, Name, Email, Phone, Message, Quote JSON,
   Attachment metadata JSON, Internal sent, Confirmation sent.
2. Open Extensions → Apps Script. Add the code below. In Project Settings → Script
   properties, set `SHEET_ID` to the spreadsheet ID and `LEAD_SECRET` to a new,
   long random secret. Keep both out of source control.
3. Deploy → New deployment → Web app. Execute as yourself; access must allow
   server-to-server requests (Anyone). Authorize only your own script. The sheet
   itself stays private. Update the web app deployment after changing code.
4. Apps Script's `doPost(e)` exposes parameters/body, **not custom request headers**
   ([Google event documentation](https://developers.google.com/apps-script/guides/web)).
   The generic logger always sends `X-Lead-Secret`, but this direct Apps Script
   example must also receive the same secret as a query parameter. Set Vercel's
   **Preview** `LEAD_WEBHOOK_URL` to the deployment `/exec` URL followed by
   `?secret=YOUR_URL_ENCODED_SECRET`, and `LEAD_WEBHOOK_SECRET` to that secret.
   Treat the complete URL as a secret; do not share it in chat, logs, or Git.
   A different webhook that supports headers should authenticate `X-Lead-Secret`
   directly and does not need a query secret. Do not forward this URL elsewhere.
5. Redeploy Preview first. With owner authorization, submit a test and verify the
   private sheet row. A safe `lead_webhook_failed` event means email still works
   but the archive was not confirmed. Apps Script latency can exceed our strict
   three-second timeout; a timed-out request may still append a row. Use lead IDs
   to identify duplicates when manually replaying a lead. No automatic retries.

```javascript
function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  const reply = (ok) =>
    ContentService.createTextOutput(JSON.stringify({ ok })).setMimeType(
      ContentService.MimeType.JSON,
    );
  if (
    !props.getProperty("LEAD_SECRET") ||
    e.parameter.secret !== props.getProperty("LEAD_SECRET")
  )
    return reply(false);
  const lock = LockService.getScriptLock();
  try {
    const lead = JSON.parse(e.postData.contents);
    if (!lead.id || !lead.timestamp || !lead.email) return reply(false);
    if (!lock.tryLock(1000)) return reply(false);
    const sheet = SpreadsheetApp.openById(
      props.getProperty("SHEET_ID"),
    ).getSheetByName("Leads");
    // Treat user-supplied cells as text, never spreadsheet formulas.
    const cell = (v) =>
      /^[=+@\-\t\r\n]/.test(String(v ?? ""))
        ? "'" + String(v)
        : String(v ?? "");
    sheet.appendRow(
      [
        lead.id,
        lead.timestamp,
        lead.source,
        lead.sourcePage,
        lead.name,
        lead.email,
        lead.phone,
        lead.message,
        JSON.stringify(lead.quote || {}),
        JSON.stringify(lead.attachments || []),
        lead.internalSent,
        lead.confirmationSent,
      ].map(cell),
    );
    return reply(true);
  } catch (_) {
    return reply(false);
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
```

The webhook receives filenames and byte counts only, never attachment contents or
IP. It must authenticate before parsing/appending. The endpoint is public but
unauthenticated submissions do not write rows; keep the secret and sheet private.
