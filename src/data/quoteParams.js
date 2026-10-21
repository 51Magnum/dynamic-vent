import catalog from "./catalog.json";
export const defaults = Object.freeze({
  size: "4x8",
  pattern: "Chevron",
  custom: false,
  finishType: "Painted (standard)",
  color: catalog.colors[0].name,
  slider: false,
  quantity: 1,
  kit: "none",
});
export function parseQuoteParams(input) {
  const params = new URLSearchParams(input);
  const pick = (key, values, fallback) =>
    values.includes(params.get(key)) ? params.get(key) : fallback;
  const rawQty = params.get("qty");
  const qty = rawQty && /^[+-]?\d+$/.test(rawQty) ? Number(rawQty) : 1;
  return {
    size: pick(
      "size",
      catalog.sizes.map((item) => item.label),
      defaults.size,
    ),
    pattern: pick(
      "pattern",
      catalog.patterns.map((item) => item.id),
      defaults.pattern,
    ),
    custom: params.get("custom") === "1",
    finishType: pick("finish", catalog.finishTypes, defaults.finishType),
    color: pick(
      "color",
      catalog.colors.map((item) => item.name),
      defaults.color,
    ),
    slider: params.get("slider") === "1",
    quantity: Math.max(1, Math.min(99, Number.isFinite(qty) ? qty : 1)),
    kit: pick(
      "kit",
      catalog.kits.map((item) => item.id),
      defaults.kit,
    ),
  };
}
export function quoteParams(quote) {
  return new URLSearchParams({
    size: quote.size,
    pattern: quote.pattern,
    custom: quote.custom ? "1" : "0",
    finish: quote.finishType,
    color: quote.color,
    slider: quote.slider ? "1" : "0",
    qty: String(quote.quantity),
    kit: quote.kit,
  });
}
export function readShopWording() {
  try {
    return (sessionStorage.getItem("dynamicvent-shop-wording") || "").slice(
      0,
      500,
    );
  } catch {
    return "";
  }
}
export function saveShopWording(wording) {
  try {
    sessionStorage.setItem("dynamicvent-shop-wording", wording);
  } catch {
    /* Optional storage. */
  }
}
