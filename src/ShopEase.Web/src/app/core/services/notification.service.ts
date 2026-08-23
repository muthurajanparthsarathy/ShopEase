import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationRepository } from '../repositories/notification.repository';
import { AppNotification } from '../models';

/**
 * Every notification is now a server-side side effect of a real business action (order placed,
 * status changed, payment completed/failed — see ShopEase.Api's OrderService/PaymentService), so this
 * is read/mark-as-read only. The old notifyX() helpers and low-level add() had no callers left once
 * Order/PaymentService moved that orchestration server-side.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private repo = inject(NotificationRepository);

  getAll(userId: number): Observable<AppNotification[]> {
    return this.repo.getForUser(userId);
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.repo.markAsRead(notificationId);
  }

  markAllAsRead(userId: number): Observable<void> {
    return this.repo.markAllAsRead(userId);
  }
}
