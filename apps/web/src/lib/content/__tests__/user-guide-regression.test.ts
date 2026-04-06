import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const webRoot = path.resolve(import.meta.dirname, "../../../..");

describe("user-guide legacy regression", () => {
  it("removes legacy runtime files from the web app", () => {
    expect(
      existsSync(path.join(webRoot, "src/hooks/useUserGuideSections.ts")),
    ).toBe(false);
    expect(
      existsSync(path.join(webRoot, "src/types/user-guide.ts")),
    ).toBe(false);
    expect(
      existsSync(path.join(webRoot, "src/components/UserGuideModal.tsx")),
    ).toBe(false);
    expect(
      existsSync(path.join(webRoot, "src/components/UserGuideTableOfContents.tsx")),
    ).toBe(false);
  });

  it("does not keep runtime imports pointing to the deleted legacy user-guide layer", () => {
    const runtimeFiles = [
      path.join(webRoot, "src/app/[locale]/user-guide/page.tsx"),
      path.join(webRoot, "src/app/[locale]/user-guide/[moduleSlug]/page.tsx"),
      path.join(webRoot, "src/components/user-guide/UserGuideLandingView.tsx"),
      path.join(webRoot, "src/components/user-guide/UserGuideModuleView.tsx"),
    ];

    for (const filePath of runtimeFiles) {
      const content = readFileSync(filePath, "utf8");
      expect(content).not.toMatch(/useUserGuideSections/);
      expect(content).not.toMatch(/UserGuideModal/);
      expect(content).not.toMatch(/UserGuideTableOfContents/);
      expect(content).not.toMatch(/@\/types\/user-guide/);
    }
  });
});
