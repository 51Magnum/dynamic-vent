const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { runChecks } = require("../scripts/check-launch.cjs");
const catalog = require("../src/data/catalog.json");
test("launch guard recognizes confirmed price and router specs, leaving return terms outstanding", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, "../scripts/check-launch.cjs")],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Template return terms missing/);
  assert.doesNotMatch(
    result.stderr,
    /price unconfirmed|Router specifications unconfirmed/,
  );
  assert.deepEqual(
    runChecks().map((problem) => problem.check),
    ["template-return-terms"],
  );
});
test("launch guard passes when decisions are filled and source wording is clean", () => {
  const confirmed = structuredClone(catalog);
  confirmed.template.priceConfirmed = true;
  confirmed.template.returnTerms =
    "Contact sales before returning an unused template.";
  confirmed.routerRequirements = {
    confirmed: true,
    router: "Test router specification",
    basePlate: "Test base specification",
    bit: "Test bit specification",
    guideBushing: "none",
    routedDepthInches: 0.25,
  };
  assert.deepEqual(runChecks({ catalog: confirmed }), []);
  confirmed.routerRequirements.bit = "[SHANE: bit]";
  assert.equal(
    runChecks({ catalog: confirmed })[0].check,
    "router-specifications",
  );
});
