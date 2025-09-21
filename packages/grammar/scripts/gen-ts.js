// Genera parser TypeScript (sin Java) usando antlr4ts-cli
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "src", "ts");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const cmd = [
  "antlr4ts",
  "-visitor",           // necesitamos Visitor
  "-o", "src/ts",
  "grammar/Language.g4"
].join(" ");

console.log("→ Generando TS con:", cmd);
execSync(cmd, { stdio: "inherit", cwd: root });
console.log("✔ Parser TS generado en src/ts");
