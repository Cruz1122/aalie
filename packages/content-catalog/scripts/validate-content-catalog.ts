import { validateCatalog } from "../src/validate.js";

const report = validateCatalog();

for (const warning of report.warnings) {
  console.warn(
    `[WARN] ${warning.code}: ${warning.message}${warning.path ? ` (${warning.path})` : ""}`,
  );
}

for (const error of report.errors) {
  console.error(
    `[ERROR] ${error.code}: ${error.message}${error.path ? ` (${error.path})` : ""}`,
  );
}

if (!report.valid) {
  process.exitCode = 1;
} else {
  console.log(
    `Content catalog validated successfully. warnings=${report.warnings.length} errors=0`,
  );
}
