import "server-only";

export class BffHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly headers: HeadersInit = {},
  ) {
    super(message);
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (
    declared &&
    Number.isFinite(Number(declared)) &&
    Number(declared) > maxBytes
  ) {
    throw new BffHttpError(
      413,
      "PAYLOAD_TOO_LARGE",
      "Request payload is too large",
    );
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > maxBytes) {
    throw new BffHttpError(
      413,
      "PAYLOAD_TOO_LARGE",
      "Request payload is too large",
    );
  }
  if (bytes.byteLength === 0) return {};

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new BffHttpError(
      400,
      "INVALID_JSON",
      "Request body must be valid JSON",
    );
  }
}
