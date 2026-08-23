import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

const TITLE_MAP: Record<string, [string, string]> = {
  dashboard: ['Dashboard', 'speedometer2'],
  products: ['Product Management', 'box-seam'],
  categories: ['Category Management', 'tags'],
  orders: ['Order Management', 'bag-check'],
  customers: ['User Management', 'people'],
  reports: ['Report Management', 'file-earmark-bar-graph'],
  backup: ['Backup & Recovery', 'cloud-arrow-down'],
  dynamic: ['Dynamic Handling', 'ui-checks-grid'],
  cms: ['Home Page Content', 'layout-text-window-reverse'],
  help: ['Help Centre', 'life-preserver'],
};

/** Static command-strip header for the admin area — title/icon/breadcrumb derived from the current URL segment. */
@Component({
  selector: 'app-admin-ribbon',
  standalone: true,
  template: `
    <div class="admin-ribbon">
      <div class="container-fluid px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="admin-ribbon-title">
          <i class="bi" [class]="'bi-' + icon()"></i>
          <span class="ribbon-page-title">{{ title() }}</span>
          <span class="ribbon-crumb">ShopEase Admin <i class="bi bi-chevron-right"></i> {{ title() }}</span>
        </div>
      </div>
    </div>
  `,
})
export class AdminRibbonComponent {
  private router = inject(Router);
  private segment = signal(this.currentSegment());

  title = computed(() => (TITLE_MAP[this.segment()] ?? ['Admin', 'grid'])[0]);
  icon = computed(() => (TITLE_MAP[this.segment()] ?? ['Admin', 'grid'])[1]);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.segment.set(this.currentSegment()));
  }

  private currentSegment(): string {
    const parts = this.router.url.split('?')[0].split('/').filter(Boolean);
    return parts[1] || 'dashboard'; // parts[0] === 'admin'
  }
}
