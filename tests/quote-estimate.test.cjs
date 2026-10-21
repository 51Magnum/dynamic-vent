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
            templatePrice: template ? catalog.template.price : 0,
            total: unit * quantity + (template ? catalog.template.price : 0),
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
      `Installation template: Yes ($${catalog.template.price.toFixed(2)}, estimated)`,
    ),
  );
  assert.doesNotMatch(selected, /kit|refund|deposit|rent/i);
});
