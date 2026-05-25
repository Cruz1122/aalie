/**
 * Prebuild cleanup: remove stale .next/export directory.
 *
 * In early iterations the project used `output: "export"` in next.config.
 * Even though that config is gone, a leftover `.next/export` can cause
 * lint/type-check conflicts during `next build`. This script ensures
 * the directory is cleaned before every build.
 *
 * Mimics the previous inline `node -e` logic with silent failure.
 */

import { rmSync } from "node:fs";
import { resolve } from "node:path";

const exportDir = resolve(process.cwd(), ".next/export");

try {
  rmSync(exportDir, { recursive: true, force: true });
  console.log(`[prebuild] cleaned ${exportDir}`);
} catch {
  // directory didn't exist or was already clean — noop
}
