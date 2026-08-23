import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationStore } from '../../core/stores/notification.store';
import { AuthStore } from '../../core/stores/auth.store';
import { ToastService } from '../../core/services/toast.service';
import { AppNotification } from '../../core/models';
import { formatDateTime } from '../../core/utils/format.utils';

const ICON_MAP: Record<string, string> = {
  success: 'bi-check-circle-fill text-success',
  error: 'bi-x-circle-fill text-danger',
  warning: 'bi-exclamation-triangle-fill text-warning',
  info: 'bi-info-circle-fill text-info',
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {
  store = inject(NotificationStore);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);

  formatDateTime = formatDateTime;

  private get userId() { return this.auth.currentUser()!.id; }

  ngOnInit(): void {
    this.store.refresh(this.userId).subscribe();
  }

  iconFor(n: AppNotification): string {
    return ICON_MAP[n.type] ?? ICON_MAP['info'];
  }

  markAsRead(n: AppNotification): void {
    if (!n.isRead) this.store.markAsRead(n.id, this.userId);
  }

  markAllAsRead(): void {
    this.store.markAllAsRead(this.userId);
    this.toast.show('All notifications marked as read.', 'success');
  }
}
