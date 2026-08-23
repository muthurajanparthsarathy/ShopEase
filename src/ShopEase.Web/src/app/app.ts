import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavbarComponent } from './shared/layout/navbar/navbar.component';
import { FooterComponent } from './shared/layout/footer/footer.component';
import { ToastHostComponent } from './shared/layout/toast-host/toast-host.component';
import { LoaderOverlayComponent } from './shared/layout/loader-overlay/loader-overlay.component';
import { AdminRibbonComponent } from './shared/layout/admin-ribbon/admin-ribbon.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastHostComponent, LoaderOverlayComponent, AdminRibbonComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private router = inject(Router);

  private url = toSignal(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)),
    { initialValue: null },
  );
  isAdminArea = computed(() => (this.url(), this.router.url.startsWith('/admin')));
  showChrome = computed(() => (this.url(), !['/login', '/register'].includes(this.router.url.split('?')[0])));
}
