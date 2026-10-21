const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const forbidden = [
  /\brent(al|ed)?\b/i,
  /deposit/i,
  /refunded upon return/i,
  /one per inquiry/i,
  /Router \+ template/i,
  /installation kit/i,
];
function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "__tests__" || /\.(test|spec)\./.test(entry.name))
      return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(file)
      : /\.(jsx?|json)$/.test(file)
        ? [file]
        : [];
  });
}
// Named checks are intentionally separate so later launch/privacy checks plug in here.
const checks = [
  {
    name: "template-price",
    run: ({ catalog }) =>
      catalog.template.priceConfirmed === true
        ? []
        : [
            "Template price unconfirmed: confirm templatePrices by size and set priceConfirmed=true.",
          ],
  },
  {
    name: "template-return-terms",
    run: ({ catalog }) =>
      typeof catalog.template.returnTerms === "string" &&
      catalog.template.returnTerms.trim()
        ? []
        : ["Template return terms missing: set template.returnTerms."],
  },
  {
    name: "router-specifications",
    run: ({ catalog }) => {
      const spec = catalog.routerRequirements;
      const missing = ["router", "basePlate", "bit"].filter(
        (key) => typeof spec[key] !== "string" || !spec[key].trim(),
      );
      const placeholders = Object.values(spec).some(
        (value) => typeof value === "string" && /\[SHANE:/i.test(value),
      );
      return spec.confirmed === true && !missing.length && !placeholders
        ? []
        : [
            "Router specifications unconfirmed or placeholders remain: fill the router, base plate and bit requirements, then set confirmed=true.",
          ];
    },
  },
  {
    name: "obsolete-source-copy",
    run: ({ root }) =>
      sourceFiles(path.join(root, "src")).flatMap((file) => {
        const matches = fs
          .readFileSync(file, "utf8")
          .split(/\r?\n/)
          .flatMap((line, index) =>
            forbidden.some((pattern) => pattern.test(line))
              ? [
                  `${path.relative(root, file)}:${index + 1}: obsolete installation-option wording.`,
                ]
              : [],
          );
        return matches;
      }),
  },
];
function runChecks({
  catalog = require("../src/data/catalog.json"),
  root: projectRoot = root,
} = {}) {
  return checks.flatMap((check) =>
    check
      .run({ catalog, root: projectRoot })
      .map((message) => ({ check: check.name, message })),
  );
}
if (require.main === module) {
  const problems = runChecks();
  if (problems.length) {
    for (const problem of problems)
      console.error(`[${problem.check}] ${problem.message}`);
    process.exitCode = 1;
  } else console.log("Launch checks passed.");
}
module.exports = { checks, runChecks };
