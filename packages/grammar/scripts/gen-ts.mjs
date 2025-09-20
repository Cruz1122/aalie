// path: packages/grammar/scripts/gen-ts.mjs
import { execFile } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const GRAM = resolve(ROOT, "grammars", "Expr.g4");
const OUT = resolve(ROOT, "ts", "src", "generated");

mkdirSync(OUT, { recursive: true });

function run(cmd, args) {
  return new Promise((res, rej) => {
    execFile(cmd, args, { cwd: ROOT }, (err, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      if (err) return rej(err);
      res();
    });
  });
}

console.log("[gen-ts] generating TypeScript into", OUT);
await run("bash", [
  resolve(ROOT, "ts", "node_modules", ".bin", "antlr4ts"),
  "-visitor",
  "-no-listener",
  "-o",
  OUT,
  GRAM
]);
console.log("[gen-ts] done.");
