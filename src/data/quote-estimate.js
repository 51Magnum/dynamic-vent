const catalog = require("./catalog.json");
const money = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
function tradeDiscountPercent(quantity) {
  return catalog.tradeDiscounts.reduce(
    (percent, tier) => quantity >= tier.minimumQuantity ? tier.percent : percent,
    0,
  );
}
function ventPricing({ size, quantity, slider = false, trade = false }) {
  if (
    !Object.hasOwn(catalog.ventPrices, size) ||
    !Number.isInteger(quantity) ||
    quantity < 1 || quantity > 10000 ||
    typeof slider !== "boolean"
  )
    throw new RangeError("Invalid vent pricing configuration");
  const discountPercent = trade ? tradeDiscountPercent(quantity) : 0;
  // Round to cents before doubling for the slider, then multiply by quantity.
  const discountedPrice =
    Math.round(catalog.ventPrices[size] * (100 - discountPercent)) / 100;
  const unitPrice = discountedPrice * (slider ? 2 : 1);
  return {
    discountPercent,
    unitPrice,
    ventsSubtotal: Math.round(unitPrice * quantity * 100) / 100,
  };
}
function estimate({ size, slider, quantity, template = false, trade = false }) {
  if (
    !Object.hasOwn(catalog.ventPrices, size) ||
    typeof template !== "boolean" ||
    typeof slider !== "boolean" ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > (trade ? 10000 : 99)
  )
    throw new RangeError("Invalid estimate configuration");
  const { unitPrice, ventsSubtotal } = ventPricing({ size, quantity, slider, trade });
  return {
    unitPrice,
    ventsSubtotal,
    templatePrice: template ? catalog.templatePrices[size] : 0,
    total: ventsSubtotal + (template ? catalog.templatePrices[size] : 0),
  };
}
function formatTradePricing(config) {
  // Keep this CommonJS module free of object spread: CRA adds ESM helpers for it.
  const totals = ventPricing({
    size: config.size, quantity: config.quantity, slider: config.slider, trade: true,
  });
  return `Standard vent reference: ${config.size}, ${money(catalog.ventPrices[config.size])} retail per vent\nTrade discount (vents only): ${totals.discountPercent}%\nShutoff slider: ${config.slider ? "Yes; doubles the discounted vent price" : "No"}\nVent unit price after discount${config.slider ? " and slider" : ""}: ${money(totals.unitPrice)}\nQuantity: ${config.quantity}\nEstimated standard-vent total: ${money(totals.ventsSubtotal)} before templates, customization, powder coating, shipping, and tax. Templates are not discounted.`;
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
module.exports = { estimate, formatQuote, money, quoteRows, routeDepth, templatePriceLabel, tradeDiscountPercent, ventPricing, formatTradePricing };
