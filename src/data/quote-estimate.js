const catalog = require("./catalog.json");
const money = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
function estimate({ size, slider, quantity, template = false }) {
  if (
    !Object.hasOwn(catalog.ventPrices, size) ||
    typeof template !== "boolean" ||
    typeof slider !== "boolean" ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 99
  )
    throw new RangeError("Invalid estimate configuration");
  const unitPrice = catalog.ventPrices[size] * (slider ? 2 : 1);
  const ventsSubtotal = unitPrice * quantity;
  return {
    unitPrice,
    ventsSubtotal,
    templatePrice: template ? catalog.template.price : 0,
    total: ventsSubtotal + (template ? catalog.template.price : 0),
  };
}
function templateSelection(selected) {
  return selected
    ? `Yes (${money(catalog.template.price)}${catalog.template.priceConfirmed ? "" : ", estimated"})`
    : "No";
}
function formatQuote(quote) {
  const totals = estimate(quote);
  const size = catalog.sizes.find((item) => item.label === quote.size);
  const pattern = catalog.patterns.find((item) => item.id === quote.pattern);
  return `Size: ${quote.size} (${size.dimensions})\nPattern: ${quote.custom ? "Custom wording/design" : pattern?.label}\nCustom wording: ${quote.custom ? quote.customNotes?.trim() || "To be discussed" : "None"}\nFinish: ${quote.finishType}\nPaint color: ${quote.color}\nShutoff slider: ${quote.slider ? "Yes" : "No"}\nQuantity: ${quote.quantity}\nInstallation template: ${templateSelection(quote.template)}\nEstimated subtotal: ${money(totals.total)} before shipping, tax, powder coating, and custom-design charges.`;
}
function quoteRows(quote) {
  const size = catalog.sizes.find((item) => item.label === quote.size);
  const pattern = catalog.patterns.find((item) => item.id === quote.pattern);
  return [
    ["Size", `${quote.size} (${size.dimensions})`],
    ["Pattern", quote.custom ? "Custom wording/design" : pattern.label],
    [
      "Custom wording",
      quote.custom ? quote.customNotes || "To be discussed" : "None",
    ],
    ["Finish", quote.finishType],
    ["Paint color", quote.color],
    ["Shutoff slider", quote.slider ? "Yes" : "No"],
    ["Quantity", quote.quantity],
    ["Installation template", templateSelection(quote.template)],
  ];
}
module.exports = { estimate, formatQuote, money, quoteRows };
