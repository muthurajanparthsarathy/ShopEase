export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationChannel = 'email' | 'sms';

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  isRead: boolean;
  createdAt: string;
}
