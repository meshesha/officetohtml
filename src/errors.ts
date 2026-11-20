/** Machine-readable error codes thrown or emitted by OfficeToHtml. */
export type OfficeErrorCode =
  /** The source could not be read (network error, HTTP status, aborted ...). */
  | "SOURCE_ERROR"
  /** The URL uses a protocol that is not allowed (e.g. `javascript:`). */
  | "INVALID_URL"
  /** The file is bigger than `maxFileSize`. */
  | "FILE_TOO_LARGE"
  /** The file type is not supported (e.g. legacy .doc / .ppt). */
  | "UNSUPPORTED_FORMAT"
  /** The file type is supported but disabled through `formats`. */
  | "FORMAT_DISABLED"
  /** A third-party library could not be loaded. */
  | "LIBRARY_LOAD_ERROR"
  /** The file is damaged or could not be parsed. */
  | "PARSE_ERROR"
  /** The file is password protected. */
  | "PASSWORD_REQUIRED"
  /** Loading was cancelled because another file was loaded or the viewer was destroyed. */
  | "ABORTED"
  /** The viewer was used after `destroy()`. */
  | "DESTROYED";

/** Error class used for every failure reported by the library. */
export class OfficeError extends Error {
  readonly code: OfficeErrorCode;
  readonly cause?: unknown;

  constructor(code: OfficeErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "OfficeError";
    this.code = code;
    this.cause = cause;
  }

  /** Wraps any thrown value in an {@link OfficeError} (keeps existing OfficeErrors). */
  static from(error: unknown, code: OfficeErrorCode = "PARSE_ERROR"): OfficeError {
    if (error instanceof OfficeError) return error;
    if (isAbortError(error)) return new OfficeError("ABORTED", "Loading was aborted", error);
    const message = error instanceof Error ? error.message : String(error);
    return new OfficeError(code, message, error);
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof OfficeError && error.code === "ABORTED") ||
    (typeof error === "object" && error !== null && (error as { name?: string }).name === "AbortError")
  );
}
