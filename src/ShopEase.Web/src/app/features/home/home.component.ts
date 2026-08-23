import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthStore } from '../../core/stores/auth.store';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { CartStore } from '../../core/stores/cart.store';
import { CmsService } from '../../core/services/cms.service';
import { ReviewService } from '../catalog/review.service';
import { ToastService } from '../../core/services/toast.service';
import { CmsConfig, CmsSection, Order, Product, ReviewStats } from '../../core/models';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { formatCurrency, formatDate, statusBadgeClass } from '../../core/utils/format.utils';

const CAT_ICONS: Record<string, string> = {
  Electronics: 'cpu', Clothing: 'bag', 'Home & Kitchen': 'house', Books: 'book',
  'Sports & Fitness': 'bicycle', 'Beauty & Personal Care': 'gem', 'Toys & Games': 'controller',
  Automotive: 'car-front', 'Grocery & Gourmet': 'basket', 'Health & Wellness': 'heart-pulse',
  Furniture: 'lamp', Footwear: 'boot', 'Stationery & Office': 'pencil', 'Pet Supplies': 'github',
  'Musical Instruments': 'music-note-beamed',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, StarRatingComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthStore);
  private authSvc = inject(AuthService);
  private productSvc = inject(ProductService);
  private orderSvc = inject(OrderService);
  private cartSvc = inject(CartService);
  private cartStore = inject(CartStore);
  private cmsSvc = inject(CmsService);
  private reviewSvc = inject(ReviewService);
  private toast = inject(ToastService);

  preview = false;
  effectiveUserId = signal<number | null>(null);
  effectiveUserName = signal('');
  config = signal<CmsConfig | null>(null);

  allProducts = signal<Product[]>([]);
  categories = signal<{ id: number; name: string; count: number }[]>([]);
  reviewStats = signal<Record<number, ReviewStats>>({});
  recentOrders = signal<Order[]>([]);

  catIcon = (name: string) => CAT_ICONS[name] ?? 'box-seam';
  formatCurrency = formatCurrency;
  formatDate = formatDate;
  statusBadgeClass = statusBadgeClass;

  private storageListener = (e: StorageEvent) => {
    const key = this.preview ? this.cmsSvc.previewKey : this.cmsSvc.key;
    if (e.key === key) this.loadConfig();
  };

  ngOnInit(): void {
    this.preview = this.route.snapshot.queryParamMap.get('preview') === '1' || window.self !== window.top;
    this.reviewSvc.ensureSeeded();

    const sessionUser = this.auth.currentUser();
    if (this.preview && this.auth.isAdmin()) {
      this.authSvc.getAllCustomers().subscribe((customers) => {
        const sample = customers[0];
        this.effectiveUserId.set(sample?.id ?? sessionUser?.id ?? null);
        this.effectiveUserName.set(sample?.name?.split(' ')[0] ?? '');
        this.loadData();
      });
    } else {
      this.effectiveUserId.set(sessionUser?.id ?? null);
      this.effectiveUserName.set(sessionUser?.name?.split(' ')[0] ?? '');
      this.loadData();
    }

    window.addEventListener('storage', this.storageListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.storageListener);
  }

  private loadData(): void {
    forkJoin([this.productSvc.getAllProducts(), this.productSvc.getAllCategories()]).subscribe(([products, cats]) => {
      this.allProducts.set(products.filter((p) => p.isActive));
      this.productSvc.getAllProducts().subscribe((all) => {
        Promise.all(cats.map((c) => new Promise<{ id: number; name: string; count: number }>((resolve) => {
          this.productSvc.getProductCountByCategory(c.id).subscribe((count) => resolve({ id: c.id, name: c.name, count }));
        }))).then((list) => this.categories.set(list));
      });
    });

    this.reviewSvc.getStatsForAll().subscribe((stats) => this.reviewStats.set(stats));

    const userId = this.effectiveUserId();
    if (userId) {
      this.orderSvc.getOrdersByUserId(userId).subscribe((orders) => {
        this.recentOrders.set([...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 3));
      });
    }

    this.loadConfig();
  }

  private loadConfig(): void {
    const obs = this.preview ? this.cmsSvc.getPreviewConfig() : this.cmsSvc.getConfig();
    obs.subscribe((cfg) => this.config.set(cfg));
  }

  heroTitle(): string {
    const h = this.config()?.hero;
    if (!h) return '';
    return h.greeting && this.effectiveUserName() ? `${h.title}, ${this.effectiveUserName()}!` : h.title;
  }

  statsFor(productId: number): ReviewStats {
    return this.reviewStats()[productId] ?? { avg: 0, count: 0 };
  }

  categoryName(categoryId: number): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? '—';
  }

  sectionProducts(sec: CmsSection): Product[] {
    let list = this.allProducts();
    if (sec.source === 'newest') list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (sec.source === 'category') list = list.filter((p) => p.categoryId === Number(sec.categoryId));
    else if (sec.source === 'manual') list = (sec.productIds ?? []).map((id) => list.find((p) => p.id === id)).filter((p): p is Product => !!p);
    else list = [...list].sort((a, b) => b.stock - a.stock);
    return list.slice(0, sec.limit || 8);
  }

  addToCart(product: Product): void {
    if (this.preview) return;
    const userId = this.effectiveUserId();
    if (!userId) return;
    this.cartSvc.addToCart(userId, product.id).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      if (result.success) this.cartStore.refresh(userId).subscribe();
    });
  }
}
