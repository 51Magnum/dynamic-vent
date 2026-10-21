const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
test("built shop is visible and useful before JavaScript or pattern images load", () => {
  const html = fs.readFileSync(
    path.resolve(__dirname, "../build/shop.html"),
    "utf8",
  );
  const document = new JSDOM(html).window.document;
  assert.equal(document.querySelector("#root").dataset.prerendered, "shop");
  assert.equal(
    document.querySelector("main h1").textContent,
    "Make it your own.",
  );
  assert.equal(document.querySelectorAll(".size-options button").length, 7);
  assert.equal(document.querySelectorAll(".pattern-options button").length, 9);
  assert.ok(
    document
      .querySelector('.configuration-summary a[href^="/contact?quote=1"]')
      .textContent.includes("Request a Quote"),
  );
  assert.equal(
    document.querySelectorAll(".pattern-options img[src]").length,
    0,
  );
  assert.equal(document.querySelectorAll("iframe").length, 0);
  assert.equal(
    document.querySelector(".preview-stage img").getAttribute("src"),
    "/vents/previews/4x8/4x8_Chevron.webp",
  );
});
