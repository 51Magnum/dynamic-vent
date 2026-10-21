import { defaults, parseQuoteParams, quoteParams } from "./quoteParams";
test("URL configuration round trips all public selections without custom notes", () => {
  const quote = {
    ...defaults,
    size: "6x14",
    slider: true,
    quantity: 3,
    kit: "withRouter",
    color: "Antique Pewter",
    pattern: "Square-2",
    custom: true,
    customNotes: "Private wording",
  };
  const encoded = quoteParams(quote).toString();
  expect(parseQuoteParams(encoded)).toEqual({
    ...quote,
    customNotes: undefined,
  });
  expect(encoded).not.toContain("Private");
});
test("invalid values fall back and quantity clamps without interpreting HTML", () => {
  expect(parseQuoteParams("size=99x99&qty=500&color=%3Cscript%3E")).toEqual({
    ...defaults,
    quantity: 99,
  });
  expect(parseQuoteParams("qty=-2&slider=yes&custom=true")).toEqual(defaults);
  expect(parseQuoteParams("qty=1.5")).toEqual(defaults);
});
