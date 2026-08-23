import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastKind;
}

export interface ConfirmToastMessage {
  id: number;
  message: string;
  type: 'warning' | 'danger' | 'info';
  resolve: (result: boolean) => void;
}

/** Signal-backed replacement for Helpers.showToast / confirmToast — rendered by shared/layout/toast-host. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<ToastMessage[]>([]);
  readonly confirmToasts = signal<ConfirmToastMessage[]>([]);

  show(message: string, type: ToastKind = 'info'): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 5000);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  confirm(message: string, type: 'warning' | 'danger' | 'info' = 'warning'): Promise<boolean> {
    return new Promise((resolve) => {
      const id = this.nextId++;
      const wrappedResolve = (result: boolean) => {
        this.confirmToasts.update((list) => list.filter((c) => c.id !== id));
        resolve(result);
      };
      this.confirmToasts.update((list) => [...list, { id, message, type, resolve: wrappedResolve }]);
    });
  }
}
