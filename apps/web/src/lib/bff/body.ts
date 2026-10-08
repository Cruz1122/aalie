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

  const reader = request.body?.getReader();
  if (!reader) return {};

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // The request is already rejected; preserve the controlled 413 response.
        }
        throw new BffHttpError(
          413,
          "PAYLOAD_TOO_LARGE",
          "Request payload is too large",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
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
