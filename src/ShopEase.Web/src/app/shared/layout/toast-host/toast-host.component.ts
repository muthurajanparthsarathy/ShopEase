import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  templateUrl: './toast-host.component.html',
})
export class ToastHostComponent {
  toastSvc = inject(ToastService);

  iconFor(type: string): string {
    return { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' }[type] ?? 'bi-info-circle-fill';
  }

  colorFor(type: string): string {
    return { success: '#198754', error: '#dc3545', warning: '#ffc107', info: '#0dcaf0' }[type] ?? '#0dcaf0';
  }

  confirmColorFor(type: string): string {
    return { warning: '#ffc107', danger: '#dc3545', info: '#0dcaf0' }[type] ?? '#ffc107';
  }
}
