import { execFile } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, fileURLToPath } from "node:url";
import { resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const GRAM = resolve(ROOT, "grammar", "Language.g4"); // tu carpeta se llama 'grammar'
const OUT  = resolve(ROOT, "src", "generated");

mkdirSync(OUT, { recursive: true });

function run(cmd, args) {
  return new Promise((res, rej) => {
    execFile(cmd, args, { cwd: ROOT }, (err, stdout, stderr) => {
      if (err) return rej(err);
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      res();
    });
  });
}

console.log("[gen-ts] generating TypeScript target into", OUT);
await run("node", [
  resolve(ROOT, "node_modules", ".bin", "antlr4ts"),
  "-visitor",
  "-no-listener",
  "-o", OUT,
  GRAM,
]);
console.log("[gen-ts] done.");
