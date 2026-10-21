const { test } = require("node:test");
const assert = require("node:assert/strict");
const { estimate, formatQuote } = require("../lib/quote-estimate.cjs");
const catalog = require("../src/data/catalog.json");
test("template is charged once across sizes, quantities and slider choices", () => {
  for (const size of catalog.sizes)
    for (const slider of [false, true])
      for (const template of [false, true])
        for (const quantity of [1, 3, 10, 99]) {
          const result = estimate({
            size: size.label,
            slider,
            quantity,
            template,
          });
          const unit = catalog.ventPrices[size.label] * (slider ? 2 : 1);
          assert.deepEqual(result, {
            unitPrice: unit,
            ventsSubtotal: unit * quantity,
            templatePrice: template ? catalog.templatePrices[size.label] : 0,
            total: unit * quantity + (template ? catalog.templatePrices[size.label] : 0),
          });
        }
});
test("estimate rejects malformed choices; quote text contains only the purchased template", () => {
  for (const change of [
    { size: "99x99" },
    { template: "yes" },
    { quantity: 1.5 },
    { quantity: 100 },
    { slider: "yes" },
  ])
    assert.throws(() =>
      estimate({
        size: "4x8",
        slider: false,
        quantity: 1,
        template: false,
        ...change,
      }),
    );
  const base = {
    size: "4x8",
    slider: false,
    quantity: 1,
    custom: true,
    customNotes: "Welcome Home",
    finishType: "Painted (standard)",
    color: "Brown",
  };
  assert.match(
    formatQuote({ ...base, template: false }),
    /Installation template: No/,
  );
  const selected = formatQuote({ ...base, template: true });
  assert.ok(
    selected.includes(
      `Installation template: Yes ($${catalog.templatePrices[base.size].toFixed(2)})`,
    ),
  );
  assert.doesNotMatch(selected, /kit|refund|deposit|rent/i);
});

test("quote text and email table use the selected routing depth and final template price", () => {
  const { quoteRows, routeDepth } = require("../lib/quote-estimate.cjs");
  for (const slider of [false, true]) {
    const quote = {
      size: "4x8",
      slider,
      quantity: 1,
      template: true,
      custom: false,
      pattern: "Chevron",
      finishType: "Painted (standard)",
      color: "Brown",
    };
    assert.ok(
      formatQuote(quote).includes(`Route ${routeDepth(slider)} in deep`),
    );
    assert.deepEqual(
      quoteRows(quote).find(([label]) => label === "Routing depth"),
      ["Routing depth", `Route ${routeDepth(slider)} in deep`],
    );
    assert.doesNotMatch(
      formatQuote(quote),
      /\(estimated\)|rental|deposit|printable|paper template/i,
    );
    assert.ok(formatQuote(quote).includes(catalog.template.description));
  }
});


test("approved template map stays size-specific in quote text and email rows", () => {
  const { quoteRows, templatePriceLabel } = require("../lib/quote-estimate.cjs");
  const expected = { "4x8":45, "4x10":49, "4x12":55, "4x14":59, "6x10":59, "6x12":65, "6x14":69 };
  assert.deepEqual(catalog.templatePrices, expected);
  assert.equal(templatePriceLabel(), "Templates from $45");
  for (const [size, price] of Object.entries(expected)) {
    const quote = { size, pattern:"Chevron", slider:false, quantity:99, template:true };
    assert.equal(estimate(quote).templatePrice, price);
    assert.ok(formatQuote(quote).includes(`Installation template: Yes ($${price.toFixed(2)})`));
    assert.deepEqual(quoteRows(quote).find(([label]) => label === "Installation template"), ["Installation template", `Yes ($${price.toFixed(2)})`]);
  }
});
