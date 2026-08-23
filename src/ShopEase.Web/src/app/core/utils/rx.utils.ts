import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * Wraps a synchronous value as an Observable with an artificial delay, so every
 * repository call has the same async shape a real HTTP call would have — swapping
 * a LocalStorage* repository for an Http* one later requires no caller changes.
 */
export function simulateLatency<T>(value: T, ms = 150): Observable<T> {
  return of(value).pipe(delay(ms));
}
