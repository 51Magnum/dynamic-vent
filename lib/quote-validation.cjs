const catalog = require("../src/data/catalog.json");
function validateQuote(input, postalCode) {
  const fail = (field) => {
    const error = new Error(`Please provide a valid ${field} for your quote.`);
    error.field = field;
    throw error;
  };
  if (!input || typeof input !== "object" || Array.isArray(input))
    fail("quote configuration");
  const quote = Object.fromEntries(
    [
      "size",
      "pattern",
      "custom",
      "customNotes",
      "finishType",
      "color",
      "slider",
      "quantity",
      "template",
      "displayedTotal",
    ].map((key) => [
      key,
      typeof input[key] === "string" ? input[key].trim() : input[key],
    ]),
  );
  if (!catalog.sizes.some((item) => item.label === quote.size)) fail("size");
  if (typeof quote.custom !== "boolean") fail("custom design option");
  if (!(
    catalog.patterns.some((item) => item.id === quote.pattern) ||
    (quote.pattern === "custom" && quote.custom)
  ))
    fail("pattern");
  if (!catalog.colors.some((item) => item.name === quote.color)) fail("color");
  if (!catalog.finishTypes.includes(quote.finishType)) fail("finish type");
  // Missing selection from a previously opened form means no template.
  quote.template ??= false;
  if (typeof quote.template !== "boolean") fail("installation template");
  if (typeof quote.slider !== "boolean") fail("shutoff slider option");
  if (
    !Number.isInteger(quote.quantity) ||
    quote.quantity < 1 ||
    quote.quantity > 99
  )
    fail("quantity");
  quote.customNotes ??= "";
  if (typeof quote.customNotes !== "string" || quote.customNotes.length > 500)
    fail("custom-design notes");
  quote.customNotes = quote.customNotes.replace(
    /[\x00-\x08\x0b-\x1f\x7f]/g,
    "",
  );
  if (
    typeof quote.displayedTotal !== "number" ||
    !Number.isFinite(quote.displayedTotal)
  )
    fail("displayed total");
  if (
    typeof postalCode !== "string" ||
    !/^[A-Za-z0-9 -]{3,20}$/.test(postalCode)
  )
    fail("postalCode");
  return quote;
}
module.exports = { validateQuote };
