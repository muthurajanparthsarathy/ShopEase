import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LogEntry } from '../models';

@Injectable()
export abstract class LogRepository {
  abstract getRecent(count?: number): Observable<LogEntry[]>;
  /** No-op against the backend — every admin/order/payment action logs itself server-side now. */
  abstract add(message: string): Observable<void>;
}

const BASE = `${environment.apiUrl}/logs`;

@Injectable()
export class HttpLogRepository extends LogRepository {
  private http = inject(HttpClient);

  override getRecent(count = 50): Observable<LogEntry[]> {
    return this.http.get<LogEntry[]>(BASE, { params: { limit: count } }).pipe(
      map((logs) => logs.map((l) => ({ timestamp: l.timestamp, message: l.message }))),
    );
  }

  override add(): Observable<void> {
    return of(undefined);
  }
}
