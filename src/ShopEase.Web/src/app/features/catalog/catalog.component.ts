import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CartStore } from '../../core/stores/cart.store';
import { WishlistStore } from '../../core/stores/wishlist.store';
import { AuthStore } from '../../core/stores/auth.store';
import { ToastService } from '../../core/services/toast.service';
import { ReviewService } from './review.service';
import { Category, Product, ReviewStats } from '../../core/models';
import { paginate, PageResult } from '../../core/utils/pagination.utils';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

declare const bootstrap: any;

const EMPTY_STATS: ReviewStats = { avg: 0, count: 0 };

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StarRatingComponent, PaginationComponent],
  templateUrl: './catalog.component.html',
})
export class CatalogComponent implements OnInit, AfterViewInit {
  private productSvc = inject(ProductService);
  private cartSvc = inject(CartService);
  private cartStore = inject(CartStore);
  wishlistStore = inject(WishlistStore);
  private reviewSvc = inject(ReviewService);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  @ViewChild('quickViewModalEl') quickViewModalEl!: ElementRef<HTMLDivElement>;
  private quickViewModal: any;

  categories = signal<Category[]>([]);
  page = signal(1);
  perPage = signal(12);
  searchTerm = signal('');
  categoryId = signal('');
  sortBy = signal('');
  minPrice = signal('');
  maxPrice = signal('');
  inStock = signal(false);

  paged = signal<PageResult<Product>>({ items: [], currentPage: 1, totalPages: 1, totalItems: 0, perPage: 12, hasNext: false, hasPrev: false });
  statsMap = signal<Record<number, ReviewStats>>({});
  quickViewProduct = signal<Product | null>(null);

  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(debounceTime(300)).subscribe((term) => {
      this.searchTerm.set(term);
      this.page.set(1);
      this.reload();
    });
  }

  ngOnInit(): void {
    this.productSvc.getAllCategories().subscribe((cats) => this.categories.set(cats));

    const params = this.route.snapshot.queryParamMap;
    if (params.get('category')) this.categoryId.set(params.get('category')!);
    if (params.get('search')) this.searchTerm.set(params.get('search')!);
    if (params.get('sort')) this.sortBy.set(params.get('sort')!);

    this.reviewSvc.ensureSeeded().subscribe(() => this.reload());
  }

  ngAfterViewInit(): void {
    this.quickViewModal = new bootstrap.Modal(this.quickViewModalEl.nativeElement);
  }

  onSearchInput(value: string): void {
    this.search$.next(value);
  }

  onFilterChange(): void {
    this.page.set(1);
    this.reload();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.categoryId.set('');
    this.sortBy.set('');
    this.minPrice.set('');
    this.maxPrice.set('');
    this.inStock.set(false);
    this.page.set(1);
    this.reload();
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.reload();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private reload(): void {
    this.productSvc.searchProducts(this.searchTerm(), {
      categoryId: this.categoryId(), sortBy: (this.sortBy() as any) || undefined,
      minPrice: this.minPrice(), maxPrice: this.maxPrice(), inStock: this.inStock(),
    }).subscribe((products) => {
      this.paged.set(paginate(products, this.page(), this.perPage()));
    });
    this.reviewSvc.getStatsForAll().subscribe((stats) => this.statsMap.set(stats));
  }

  statsFor(productId: number): ReviewStats {
    return this.statsMap()[productId] ?? EMPTY_STATS;
  }

  categoryName(categoryId: number): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? '—';
  }

  addToCart(product: Product): void {
    const userId = this.auth.currentUser()!.id;
    this.cartSvc.addToCart(userId, product.id).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      if (result.success) this.cartStore.refresh(userId).subscribe();
    });
  }

  toggleWishlist(product: Product): void {
    const userId = this.auth.currentUser()!.id;
    const wasInWishlist = this.wishlistStore.has(product.id);
    this.wishlistStore.toggle(userId, product.id);
    this.toast.show(wasInWishlist ? 'Removed from wishlist.' : 'Added to wishlist.', wasInWishlist ? 'info' : 'success');
  }

  openQuickView(product: Product): void {
    this.quickViewProduct.set(product);
    this.quickViewModal.show();
  }
}
