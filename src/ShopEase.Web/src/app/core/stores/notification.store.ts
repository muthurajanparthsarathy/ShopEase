import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AppNotification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private notifications = inject(NotificationService);

  readonly items = signal<AppNotification[]>([]);
  readonly unreadCount = computed(() => this.items().filter((n) => !n.isRead).length);

  refresh(userId: number): Observable<AppNotification[]> {
    return this.notifications.getAll(userId).pipe(tap((list) => this.items.set(list)));
  }

  markAsRead(id: number, userId: number): void {
    this.notifications.markAsRead(id).subscribe(() => this.refresh(userId).subscribe());
  }

  markAllAsRead(userId: number): void {
    this.notifications.markAllAsRead(userId).subscribe(() => this.refresh(userId).subscribe());
  }

  clear(): void {
    this.items.set([]);
  }
}
