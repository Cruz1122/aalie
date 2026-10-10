const OPERATOR_ADMIN_EMAILS = new Set([
  "luzenith_g@ucaldas.edu.co",
  "jhon.patino29550@ucaldas.edu.co",
  "juan.cruz37552@ucaldas.edu.co",
  "juan.miranda41303@ucaldas.edu.co",
]);

export function isOperatorAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase();
  return Boolean(normalized && OPERATOR_ADMIN_EMAILS.has(normalized));
}
