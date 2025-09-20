// Genera parser Python (requiere Java 8+) usando el jar oficial de ANTLR
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const jar = path.join(root, "tooling", "antlr-4.13.2-complete.jar");
const outDir = path.join(root, "out", "py");

if (!existsSync(jar)) {
  console.error("✖ No se encontró tooling/antlr-4.13.2-complete.jar");
  process.exit(1);
}
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const cmd = [
  "java", "-jar", `"${jar}"`,
  "-Dlanguage=Python3",
  "-visitor",
  "-o", "out/py",
  "grammar/Language.g4"
].join(" ");

console.log("→ Generando Python con:", cmd);
execSync(cmd, { stdio: "inherit", cwd: root });
console.log("✔ Parser Python generado en out/py");
