import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models';

@Injectable()
export abstract class NotificationRepository {
  abstract getForUser(userId: number): Observable<AppNotification[]>;
  abstract markAsRead(id: number): Observable<void>;
  abstract markAllAsRead(userId: number): Observable<void>;
}

const BASE = `${environment.apiUrl}/notifications`;

@Injectable()
export class HttpNotificationRepository extends NotificationRepository {
  private http = inject(HttpClient);

  // userId is server-derived from the JWT — kept as a param only for interface parity with callers.
  override getForUser(_userId: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(BASE);
  }

  override markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${BASE}/${id}/read`, {});
  }

  override markAllAsRead(_userId: number): Observable<void> {
    return this.http.patch<void>(`${BASE}/read-all`, {});
  }
}
