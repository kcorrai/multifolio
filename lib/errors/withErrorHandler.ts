// Tüm API uç noktaları bu sarmalayıcıdan geçer. SERT KURAL: hiçbir hata
// sessizce yutulmaz. Bilinen AppError'lar yapılandırılmış cevaba çevrilir;
// bilinmeyen her hata Sentry'ye gönderilir ve istemciye generic 500 döner
// (iç detay sızdırılmaz). Her cevap, log ile eşleştirme için bir requestId taşır.
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { AppError, InternalError, isAppError } from "./AppError";

export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

type RouteContext = { params: Promise<Record<string, string | string[]>> };
type RouteHandler = (req: Request, context: RouteContext) => Promise<Response> | Response;

function newRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function toAppError(err: unknown): AppError {
  if (isAppError(err)) return err;
  return new InternalError(undefined, { cause: err });
}

/**
 * Bir route handler'ı sarar ve hata yönetimini merkezîleştirir.
 *
 * @example
 *   export const POST = withErrorHandler(async (req) => { ... });
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    const requestId = newRequestId();
    try {
      return await handler(req, context);
    } catch (err) {
      const appError = toAppError(err);

      // İstemciye gösterilebilir (expose) hataları sadece logla; beklenmeyen
      // (5xx) hataları Sentry'ye gönder — requestId ile ilişkilendirilebilir.
      if (!appError.expose) {
        Sentry.withScope((scope) => {
          scope.setTag("requestId", requestId);
          scope.setContext("appError", {
            code: appError.code,
            httpStatus: appError.httpStatus,
            ...appError.context,
          });
          Sentry.captureException(appError.cause ?? appError);
        });
      }

      // Yapılandırılmış log (sessiz yutma yok).
      console.error(
        `[${requestId}] ${appError.code} (${appError.httpStatus}): ${appError.message}`,
        appError.context ?? {},
      );

      const body: ErrorResponseBody = {
        error: {
          code: appError.code,
          // expose:false ise iç mesajı maskele.
          message: appError.expose ? appError.message : "Beklenmeyen bir hata oluştu.",
          requestId,
        },
      };

      return NextResponse.json(body, {
        status: appError.httpStatus,
        headers: { "x-request-id": requestId },
      });
    }
  };
}
