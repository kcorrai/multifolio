// Tipli uygulama hataları.
// Her hatanın makine-okunur bir `code`'u, bir HTTP statüsü ve istemciye
// gösterilmesinin güvenli olup olmadığını belirten `expose` bayrağı vardır.
// İstemciye yalnızca `expose:true` olan mesajlar döner; aksi halde generic mesaj.

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface AppErrorOptions {
  /** Hatayı tetikleyen alttaki hata (loglama/Sentry için zincir). */
  cause?: unknown;
  /** Sentry/log'a eklenecek ek bağlam (gizli veri koyma). */
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  /** true → mesaj istemciye gösterilebilir; false → generic mesajla maskelenir. */
  readonly expose: boolean;
  readonly context?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    httpStatus: number,
    message: string,
    expose: boolean,
    options: AppErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.expose = expose;
    this.context = options.context;
    Error.captureStackTrace?.(this, new.target);
  }
}

/** 400 — Girdi doğrulaması (Zod) başarısız. Mesaj istemciye gösterilir. */
export class ValidationError extends AppError {
  constructor(message = "Geçersiz girdi.", options?: AppErrorOptions) {
    super("VALIDATION_ERROR", 400, message, true, options);
  }
}

/** 401 — Kimlik doğrulanmamış. */
export class AuthError extends AppError {
  constructor(message = "Kimlik doğrulaması gerekli.", options?: AppErrorOptions) {
    super("UNAUTHORIZED", 401, message, true, options);
  }
}

/** 403 — Kimlik var ama yetki yok. */
export class ForbiddenError extends AppError {
  constructor(message = "Bu işlem için yetkiniz yok.", options?: AppErrorOptions) {
    super("FORBIDDEN", 403, message, true, options);
  }
}

/** 404 — Kaynak bulunamadı. */
export class NotFoundError extends AppError {
  constructor(message = "Kaynak bulunamadı.", options?: AppErrorOptions) {
    super("NOT_FOUND", 404, message, true, options);
  }
}

/** 429 — Hız sınırı aşıldı. */
export class RateLimitError extends AppError {
  constructor(message = "Çok fazla istek. Lütfen sonra deneyin.", options?: AppErrorOptions) {
    super("RATE_LIMITED", 429, message, true, options);
  }
}

/** 500 — Beklenmeyen sunucu hatası. Mesaj istemciye SIZDIRILMAZ (expose:false). */
export class InternalError extends AppError {
  constructor(message = "Beklenmeyen bir hata oluştu.", options?: AppErrorOptions) {
    super("INTERNAL_ERROR", 500, message, false, options);
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
