const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const worktree = process.argv.includes("--worktree");
const files = execFileSync(
  "git",
  worktree
    ? ["ls-files", "--cached", "--others", "--exclude-standard", "-z"]
    : ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
const problems = [];
for (const file of files) {
  if (/(^|\/)\.env($|\.)/.test(file) && !file.endsWith(".example")) {
    problems.push(`${file}: environment files must not be committed`);
    continue;
  }
  if (
    !/\.(js|jsx|cjs|json|env|example)$/.test(file) ||
    file.startsWith("tests/") ||
    file.endsWith(".test.jsx") ||
    file === "scripts/check-secrets.cjs"
  )
    continue;
  if (worktree && !fs.existsSync(file)) continue;
  const content = worktree
    ? fs.readFileSync(file, "utf8")
    : execFileSync("git", ["show", `:${file}`], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      });
  if (
    /\b(?:EMAIL_PASS|SMTP_PASSWORD|password|pass)\s*[:=]\s*["'][^"'\r\n]{4,}["']/i.test(
      content,
    )
  )
    problems.push(
      `${file}: possible hardcoded password; use a server environment variable`,
    );
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(
  "Checked files contain no environment files or obvious hardcoded SMTP passwords.",
);
