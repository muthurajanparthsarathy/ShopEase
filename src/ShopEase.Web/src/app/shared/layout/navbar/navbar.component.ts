import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from '../../../core/stores/auth.store';
import { CartStore } from '../../../core/stores/cart.store';
import { NotificationStore } from '../../../core/stores/notification.store';
import { WishlistStore } from '../../../core/stores/wishlist.store';

const MOBILE_BREAKPOINT = 992; // matches the CSS `--se-nav-breakpoint` in navbar.component.scss

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements AfterViewInit {
  auth = inject(AuthStore);
  cart = inject(CartStore);
  notifications = inject(NotificationStore);
  wishlist = inject(WishlistStore);
  private router = inject(Router);

  @ViewChild('mobileNavEl') private mobileNavEl?: ElementRef<HTMLElement>;

  scrolled = signal(false);
  isAdminArea = signal(false);
  promoDismissed = signal(sessionStorage.getItem('se_promo_dismissed') === '1');

  /** Drives the mobile dropdown panel — the hamburger button toggles this. */
  mobileMenuOpen = signal(false);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.isAdminArea.set(this.router.url.startsWith('/admin'));
      this.closeMobileMenu(); // close on every navigation so the menu never lingers over the new page
    });
    this.isAdminArea.set(this.router.url.startsWith('/admin'));

    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.cart.refresh(user.id).subscribe();
        this.notifications.refresh(user.id).subscribe();
        this.wishlist.refresh(user.id).subscribe();
      } else {
        this.cart.clear();
        this.notifications.clear();
        this.wishlist.clear();
      }
    });

    // Keep <body> scroll locked only while the mobile panel is actually open, and only on mobile widths.
    effect(() => {
      document.body.classList.toggle('se-nav-open', this.mobileMenuOpen());
    });
  }

  ngAfterViewInit(): void {
    // Forces the browser to commit/paint the panel's initial (closed) styles as their own frame
    // before any interaction is possible, so the first open transitions from a real committed
    // state rather than one that's still pending in the same layout pass.
    void this.mobileNavEl?.nativeElement.offsetHeight;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }

  @HostListener('window:resize')
  onResize(): void {
    // If the viewport grows into desktop territory while the mobile panel is open, close it —
    // otherwise it'd be stuck "open" (but invisible, since CSS hides it) and body scroll would stay locked.
    if (window.innerWidth >= MOBILE_BREAKPOINT) this.closeMobileMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMobileMenu();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    if (this.mobileMenuOpen()) this.mobileMenuOpen.set(false);
  }

  dismissPromo(): void {
    this.promoDismissed.set(true);
    sessionStorage.setItem('se_promo_dismissed', '1');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
