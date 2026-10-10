import { describe, expect, it } from "vitest";

import { isOperatorAdminEmail } from "../operator-admins";

describe("operator admin emails", () => {
  it("recognizes the four evaluation operators", () => {
    expect(isOperatorAdminEmail(" Juan.Cruz37552@ucaldas.edu.co ")).toBe(true);
    expect(isOperatorAdminEmail("luzenith_g@ucaldas.edu.co")).toBe(true);
    expect(isOperatorAdminEmail("jhon.patino29550@ucaldas.edu.co")).toBe(true);
    expect(isOperatorAdminEmail("juan.miranda41303@ucaldas.edu.co")).toBe(true);
  });

  it("leaves students as regular users", () => {
    expect(isOperatorAdminEmail("jacobo.arroyave46095@ucaldas.edu.co")).toBe(
      false,
    );
    expect(isOperatorAdminEmail(null)).toBe(false);
  });
});
