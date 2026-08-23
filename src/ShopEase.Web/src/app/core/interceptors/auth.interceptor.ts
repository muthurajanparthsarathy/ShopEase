import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, map, switchMap, take, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionStore } from '../services/session-store.service';

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// Module-level (not per-request) so concurrent 401s share one in-flight refresh instead of each
// firing their own — the first request to 401 refreshes, the rest wait on the same result.
let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

/** Attaches the bearer token to our API's requests and transparently refreshes on a 401 once. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionStore = inject(SessionStore);
  const http = inject(HttpClient);
  const router = inject(Router);

  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/refresh'].some((p) => req.url.includes(p));
  const accessToken = sessionStore.getAccessToken();
  const authedReq = accessToken && !isAuthEndpoint ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }) : req;

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      const refreshToken = sessionStore.getRefreshToken();
      if (!refreshToken) {
        sessionStore.clear();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshedToken$.next(null);

        return refreshTokens(http, sessionStore, router, refreshToken).pipe(
          switchMap((newAccessToken) => {
            isRefreshing = false;
            refreshedToken$.next(newAccessToken);
            return next(req.clone({ setHeaders: { Authorization: `Bearer ${newAccessToken}` } }));
          }),
        );
      }

      // A refresh is already in flight for another request — wait for it, then retry with its token.
      return refreshedToken$.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap((token) => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
      );
    }),
  );
};

function refreshTokens(http: HttpClient, sessionStore: SessionStore, router: Router, refreshToken: string): Observable<string> {
  return http.post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
    tap((res) => sessionStore.setTokens(res.accessToken, res.refreshToken)),
    map((res) => res.accessToken),
    catchError((err) => {
      isRefreshing = false;
      sessionStore.clear();
      router.navigate(['/login']);
      return throwError(() => err);
    }),
  );
}
