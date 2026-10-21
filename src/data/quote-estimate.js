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
    templatePrice: template ? catalog.templatePrices[size] : 0,
    total: ventsSubtotal + (template ? catalog.templatePrices[size] : 0),
  };
}
function templatePriceLabel(size) {
  return Object.hasOwn(catalog.templatePrices, size)
    ? money(catalog.templatePrices[size])
    : `Templates from $${Math.min(...Object.values(catalog.templatePrices))}`;
}
function routeDepth(slider) {
  return slider
    ? catalog.routerRequirements.depths.withSlider
    : catalog.routerRequirements.depths.ventOnly;
}
function templateSelection(selected, size) {
  return selected
    ? `Yes (${money(catalog.templatePrices[size])})`
    : "No";
}
function formatQuote(quote) {
  const totals = estimate(quote);
  const size = catalog.sizes.find((item) => item.label === quote.size);
  const pattern = catalog.patterns.find((item) => item.id === quote.pattern);
  return `Size: ${quote.size} (${size.dimensions})\nPattern: ${quote.custom ? "Custom wording/design" : pattern?.label}\nCustom wording: ${quote.custom ? quote.customNotes?.trim() || "To be discussed" : "None"}\nFinish: ${quote.finishType}\nPaint color: ${quote.color}\nShutoff slider: ${quote.slider ? "Yes" : "No"}\nRouting depth: Route ${routeDepth(quote.slider)} in deep\nQuantity: ${quote.quantity}\nInstallation template: ${templateSelection(quote.template, quote.size)}${quote.template ? `\nTemplate guide: ${catalog.template.description}` : ""}\nEstimated subtotal: ${money(totals.total)} before shipping, tax, powder coating, and custom-design charges.`;
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
    ["Routing depth", `Route ${routeDepth(quote.slider)} in deep`],
    ["Quantity", quote.quantity],
    ["Installation template", templateSelection(quote.template, quote.size)],
    ...(quote.template
      ? [["Template guide", catalog.template.description]]
      : []),
  ];
}
module.exports = { estimate, formatQuote, money, quoteRows, routeDepth, templatePriceLabel };
