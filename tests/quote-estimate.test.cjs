const { test } = require("node:test");
const assert = require("node:assert/strict");
const { estimate, formatQuote } = require("../lib/quote-estimate.cjs");
const catalog = require("../src/data/catalog.json");
test("shared estimates retain every size, slider, and kit price/refund", () => {
  for (const size of catalog.sizes)
    for (const slider of [false, true])
      for (const kit of catalog.kits) {
        const result = estimate({
          size: size.label,
          slider,
          quantity: 3,
          kit: kit.id,
        });
        const unit = catalog.ventPrices[size.label] * (slider ? 2 : 1);
        assert.deepEqual(result, {
          unitPrice: unit,
          ventsSubtotal: unit * 3,
          kitPrice: kit.price,
          kitRefund: kit.refund,
          total: unit * 3 + kit.price,
        });
      }
  assert.equal(
    estimate({ size: "6x14", slider: true, quantity: 3, kit: "withRouter" })
      .total,
    532,
  );
});
test("estimate rejects malformed options rather than inventing a price", () => {
  for (const change of [
    { size: "99x99" },
    { kit: "missing" },
    { quantity: 1.5 },
    { quantity: 100 },
    { slider: "yes" },
  ])
    assert.throws(() =>
      estimate({
        size: "4x8",
        slider: false,
        quantity: 1,
        kit: "none",
        ...change,
      }),
    );
  assert.match(
    formatQuote({
      size: "4x8",
      slider: false,
      quantity: 1,
      kit: "none",
      custom: true,
      customNotes: "Welcome Home",
      finishType: "Painted (standard)",
      color: "Brown",
    }),
    /Custom wording: Welcome Home/,
  );
});
