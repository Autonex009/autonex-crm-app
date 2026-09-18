/**
 * Error carrying the HTTP status and the gateway's `{ "error": ... }` message.
 *
 * `status: 0` is reserved for transport failures — the server being down, DNS
 * failing, a blocked CORS preflight — where no HTTP response ever arrived. The
 * distinction matters to callers: a 500 means retry later, a 0 means the user
 * has no connection to this API at all.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** True when `err` is an ApiError with the given status. */
export function isStatus(err: unknown, status: number): boolean {
  return err instanceof ApiError && err.status === status;
}
