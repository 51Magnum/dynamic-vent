const catalog = require("./catalog.json");
const money = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
function estimate({ size, slider, quantity, kit }) {
  const option = catalog.kits.find((item) => item.id === kit);
  if (
    !Object.hasOwn(catalog.ventPrices, size) ||
    !option ||
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
    kitPrice: option.price,
    kitRefund: option.refund,
    total: ventsSubtotal + option.price,
  };
}
function formatQuote(quote) {
  const totals = estimate(quote);
  const size = catalog.sizes.find((item) => item.label === quote.size);
  const pattern = catalog.patterns.find((item) => item.id === quote.pattern);
  const kit = catalog.kits.find((item) => item.id === quote.kit);
  return `Size: ${quote.size} (${size.dimensions})\nPattern: ${quote.custom ? "Custom wording/design" : pattern?.label}\nCustom wording: ${quote.custom ? quote.customNotes?.trim() || "To be discussed" : "None"}\nFinish: ${quote.finishType}\nPaint color: ${quote.color}\nShutoff slider: ${quote.slider ? "Yes" : "No"}\nQuantity: ${quote.quantity}\nInstallation kit: ${kit.label}\nEstimated subtotal: ${money(totals.total)} before shipping, tax, powder coating, and custom-design charges.${totals.kitRefund ? `\nKit refund upon return: ${money(totals.kitRefund)}` : ""}`;
}
function quoteRows(quote) {
  const size = catalog.sizes.find((item) => item.label === quote.size);
  const pattern = catalog.patterns.find((item) => item.id === quote.pattern);
  const kit = catalog.kits.find((item) => item.id === quote.kit);
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
    ["Installation kit", kit.label],
    ["Kit refund upon return", money(kit.refund)],
  ];
}
module.exports = { estimate, formatQuote, money, quoteRows };
