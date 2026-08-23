import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Result } from '../models';

/**
 * Adapts a raw HTTP call (REST-idiomatic: plain DTOs + status codes, errors as ProblemDetails) into
 * the Result<T> shape every service/component in this app already expects — so swapping repositories
 * from localStorage to HTTP requires no changes downstream of the repository layer.
 */
export function toResult<T>(source: Observable<T>, successMessage = ''): Observable<Result<T>> {
  return source.pipe(
    map((data) => ({ success: true, data, message: successMessage }) as Result<T>),
    catchError((err: unknown) => of({ success: false, message: extractErrorMessage(err) } as Result<T>)),
  );
}

/** Same adapter for endpoints with no response body (204 No Content). */
export function toVoidResult(source: Observable<unknown>, successMessage = ''): Observable<Result> {
  return source.pipe(
    map(() => ({ success: true, message: successMessage }) as Result),
    catchError((err: unknown) => of({ success: false, message: extractErrorMessage(err) } as Result)),
  );
}

export function extractErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body?.title) return body.title;
    if (body?.errors) {
      const first = Object.values(body.errors as Record<string, string[]>)[0];
      if (Array.isArray(first) && first.length) return first[0];
    }
    if (err.status === 0) return 'Cannot reach the server. Please check your connection.';
  }
  return 'Something went wrong. Please try again.';
}
