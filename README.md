# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Quote requests and trade artwork

The site uses a quote workflow rather than collecting payment. `/shop` passes the
configured order to `/contact`; `/trade` collects project quantities, wording,
and up to three PNG/JPG/PDF attachments (2 MB combined). The contact API independently attempts an internal notification and a transactional
customer confirmation. An HTTP success means at least one was accepted by SMTP;
it is not a mailbox-delivery guarantee. Failed submissions keep form contents.
See the Contact pipeline section below for delivery flags and configuration.

Local API development uses `node server.js`; run the frontend through `vercel dev`
for same-origin API routing, or configure a local proxy. Never commit real
environment files or use `REACT_APP_` prefixes for server secrets.

Run `npm test -- --watchAll=false`, `npm run test:server`, and `npm run build`.
The build generates a distinct HTML title, description, canonical URL, and social
metadata for every route, plus `sitemap.xml`. Route metadata lives in
`src/data/page-meta.json`; new routes also need an entry in `vercel.json`.
Run `npm run check:secrets` after staging changes, before committing. This is a
basic staged-file safeguard, not a complete secret scanner.

## Credential exposure follow-up

Commit `41e6b0e` included a populated SMTP password in `.env`. That file is absent
from the current tracked tree, but the historical credential must be treated as
exposed. A Microsoft 365 administrator must rotate the password, revoke existing
sessions, review sign-in activity and mailbox forwarding/inbox rules, and update
Vercel’s `EMAIL_PASS` for each environment where it is used. Redeploy after changing
the variable. Do not copy the exposed or replacement password into issues, logs,
chat, or commits. Rewriting Git history is not a substitute for rotation.

The owner-approved About, Trade, and 30-day Returns & Warranty copy is published
in the corresponding page components. Do not add a phone number. Standard vents
are painted aluminum; powder coating is an optional upgrade priced by quote.

## Shop first render

The build renders `/shop` using the shared React layout and shop components.
Its HTML includes the shop content before any browser JavaScript runs;
`src/index.js` hydrates that markup. Other routes are split into separate chunks
so their page code is not needed to open the shop. Pattern thumbnails start only
when their area approaches the viewport. Keep build rendering free of browser-only
APIs, and run `npm run test:prerender` after `npm run build`.

For a browser timing check, open `/shop?measure=1`. A buffered Paint Timing
observer records first contentful paint in a `shop-first-contentful-paint-ms`
meta tag. Measurement is opt-in and makes no analytics/network requests.

## Contact pipeline

> **Privacy prerequisite:** Do not set LEAD_WEBHOOK_URL in Production until the /privacy page is live and lists Google Sheets.
> Keep the Production variable unset. Preview-only webhook tests may be enabled
> with owner authorization; publishing the page does not automatically enable the sink.

`/api/contact` validates and trims input, drops honeypot submissions with a success
response, applies IP limits before decoding artwork, and validates up to three
PNG/JPG/PDF files (2 MB combined). Client IP precedence is first `x-forwarded-for`,
then `x-real-ip`, then socket address; only a SHA-256 key is used by the limiter.
These headers must be supplied/overwritten by the trusted hosting proxy.

The customer confirmation is attempted first so the internal notification can
include its final delivery status. Each send has its own error handling; either
can succeed when the other fails. Only the internal notification includes artwork;
the confirmation includes filenames and a message summary of at most 2,000
characters, plus an ellipsis when truncated. HTML values are escaped. Both emails
use the mailbox in `EMAIL_USER`; customer replies go to `SALES_EMAIL` (default
`sales@dynamicvent.com`) and internal replies go to the customer. The response
contains `ok`, `message`, `internalSent`, and `confirmationSent` if either succeeds;
both failing produces 502. A 429 includes `Retry-After` and preserves the form.
Honeypots return success with both flags false and send/log no lead.

`src/data/reply-time.json` is the single reply-time setting used in email and UI.
`quote-confirmation.json` contains a `{replyTime}` placeholder, expanded by the
handler and the UI helper. Rebuild/redeploy after editing it.

Environment variable names and comments are listed in `.env.example`, without
values. Required: `EMAIL_USER`, `EMAIL_PASS` (the M365 app password when MFA is
used). Optional: `SALES_EMAIL`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS`,
`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `LEAD_WEBHOOK_URL`, and
`LEAD_WEBHOOK_SECRET`. Set secrets only in Vercel's server environment settings.
The default path uses the existing M365 mailbox, with no new dependency/service.

The default limiter allows five IP submissions per ten minutes and three customer
confirmations per recipient per hour. The recipient cap skips only confirmations;
internal notifications still send. The in-memory Map is **best effort**: per warm
function instance, reset on cold start, and unshared across concurrent instances
or regions. Expired keys are pruned and active keys capped at 10,000 (oldest-key
eviction fails open). For shared limits, optionally connect Upstash Redis through
the Vercel Marketplace and set both Upstash variables. The REST INCR/EXPIRE
pipeline uses time-bucketed keys, so retries do not extend the limit window.
Upstash errors/timeouts fall back to local memory with a safe diagnostic event.
The free tier is optional; no paid service is required or provisioned here.

After send attempts, a single structured `lead` event records the UUID, UTC ISO
time, source, source page, customer details, message, optional structured quote,
attachment filenames/byte counts, and delivery flags. It never contains artwork
content or IP. Only the `lead` event contains customer data; error events contain
controlled diagnostics and lead IDs. Protect access to runtime logs accordingly.
Vercel runtime logs have short retention (about one hour on Hobby and one day on
Pro; the project moves to Pro at commercial launch), so they are **not durable storage**. The internal email remains the primary
record. See [Vercel's retention documentation](https://vercel.com/docs/logs/runtime).

For a recommended free durable record, set `LEAD_WEBHOOK_URL` and
`LEAD_WEBHOOK_SECRET` using [the private Google Sheet setup](docs/lead-sheet-webhook.md).
The logger POSTs JSON with `X-Lead-Secret`; the webhook has a three-second total
timeout and never changes email delivery or HTTP success. Leave the variables
unset to disable it. No new dependency or cost is required, Shane can read/sort
leads in Sheets, and sinks in `lib/lead-log.cjs` can be swapped for Redis or a CRM
without changing the handler. The Apps Script example prevents formula injection
and documents its special authentication requirement.

Validate with `npm test -- --watchAll=false --runInBand`, `npm run test:server`,
`npm run build && npm run test:prerender`, and
`npm run check:secrets -- --worktree`. SMTP, webhook and Redis tests use mocks;
they send no live messages. Before merging, use a Vercel Preview with existing
Preview mailbox credentials for owner-authorized delivery checks. Never deliberately
change Production credentials to test failures. Exercise general/trade submissions,
artwork-only-on-internal, a filled honeypot, six submissions, and runtime lead
flags. Simulate SMTP failures in unit tests, or only in an isolated Preview.

## Shareable configured quotes

`src/data/catalog.json` is the single size/pattern/color/finish/template/price catalog.
`options.js` and `pricing.js` retain their existing public exports. The pure estimate
implementation lives in `src/data/quote-estimate.js` (CommonJS in a `.js` file so
CRA bundles it as executable code), re-exported by `lib/quote-estimate.cjs` and
`src/data/quoteEstimate.js`. `ventPrices` holds the retail prices. `tradeDiscounts` holds the quantity tiers, applied only to Trade page inquiries; Shop quotes stay at retail. Sliders double the vent price after any trade discount. Template sets are size-specific, purchased once per configured size; `templatePrices` next to `ventPrices` holds their final prices. Template charges are separate from vent quantities and are never discounted.

Shop URL selections are parsed against the catalog and quantities clamped to
1–99. The initial Shop render uses defaults to match prerendered HTML, then a
mount effect applies URL values. The CTA goes to `/contact?quote=1&…`; direct
loads and refreshes use the same shared parser. Custom wording stays in tab-local
sessionStorage (`dynamicvent-shop-wording`), never in the URL. A shared URL cannot
transfer personal wording; the customer can add it in the quote form.

The quote form retains typed details under `dynamicvent-inquiry`, updates quantity
and estimate in the URL, and collects optional phone plus required delivery ZIP.
`/api/contact` remains the only endpoint. Retail quotes require a catalog-valid
structured `quote` plus ZIP, and the server recomputes prices before sending mail.
The internal configuration table shows server and displayed estimates, flagging
any difference over one cent. The lead and customer confirmation contain the
validated configuration. General and Trade inquiries retain their existing flow.
No payment is collected and all subtotals exclude shipping, tax, powder coating
and custom-design charges. Success and error focus are managed for keyboard users.

Browser verification covers the production build with a saved non-default Shop
URL (including its template-inclusive estimate), clean hydration console, refresh/Back/direct
quote links, custom wording, and a 320px layout without horizontal overflow.
Live delivery verification uses an owner-authorized Preview submission before
merging; unit tests otherwise mock SMTP and send no mail.

## Before launch

Run `npm run check:launch` before publishing. It is separate from `build`.
The final physical installation template prices by size, router setup and both routing
depths live in `src/data/catalog.json`. The template is sold outright, and the
router's round sub-base sits down inside it. Shop, quote summaries and emails use
the selected slider state to choose the routing depth. The full installation
section and FAQ show both depths and the shared router, sub-base and bit specs.

The price and router specifications are confirmed. The remaining launch check
requires the owner's `template.returnTerms`; until supplied, the policy directs
questions about returning a template to sales. Existing vent terms are unchanged.
The guard also scans non-test source files for obsolete installation wording.
