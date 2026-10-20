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
and up to three PNG/JPG/PDF attachments (2 MB combined). The contact API sends
these to `sales@dynamicvent.com`, with the customer’s address as Reply-To.
Confirmation is shown only after SMTP accepts the message; this is not a
mailbox-delivery guarantee. Failed submissions keep the form contents.

Set `EMAIL_USER` and `EMAIL_PASS` as server-only environment variables in Vercel.
All inquiries go to `sales@dynamicvent.com`. Never use a `REACT_APP_`
prefix for these values. `.env.example` contains names only. Local API development
uses `node server.js`; run the frontend through `vercel dev` for same-origin API
routing, or configure a local proxy. Do not commit real environment files.

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
