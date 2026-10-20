const fs = require("node:fs");
const path = require("node:path");
const pages = require("../src/data/page-meta.json");
const base = fs.readFileSync(
  path.join(__dirname, "../build/index.html"),
  "utf8",
);
const shopMarkup = require("./render-shop.cjs")();
const escape = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
for (const [route, metadata] of Object.entries(pages)) {
  const url = `https://www.dynamicvent.com${route === "/" ? "/" : route}`;
  let html = base
    .replace(/<title>.*?<\/title>/, `<title>${escape(metadata.title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?\s*>/,
      `<meta name="description" content="${escape(metadata.description)}"/>`,
    )
    .replace(
      "</head>",
      `<link rel="canonical" href="${url}"/><meta property="og:title" content="${escape(metadata.title)}"/><meta property="og:description" content="${escape(metadata.description)}"/><meta property="og:url" content="${url}"/><meta property="og:type" content="website"/><meta property="og:image" content="${escape(metadata.image)}"/></head>`,
    );
  if (route === "/shop")
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root" data-prerendered="shop">${shopMarkup}</div>`,
    );
  const target = path.join(
    __dirname,
    "../build",
    route === "/" ? "index.html" : `${route.slice(1)}.html`,
  );
  fs.writeFileSync(target, html);
}
fs.writeFileSync(
  path.join(__dirname, "../build/sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(
    pages,
  )
    .map(
      (route) =>
        `<url><loc>https://www.dynamicvent.com${route === "/" ? "/" : route}</loc></url>`,
    )
    .join("")}</urlset>`,
);
console.log(
  `Generated unique HTML metadata for ${Object.keys(pages).length} pages and sitemap.xml.`,
);
