import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CartStore } from '../../core/stores/cart.store';
import { WishlistStore } from '../../core/stores/wishlist.store';
import { AuthStore } from '../../core/stores/auth.store';
import { ToastService } from '../../core/services/toast.service';
import { ReviewService } from '../catalog/review.service';
import { Product, ReviewStats } from '../../core/models';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, StarRatingComponent],
  templateUrl: './wishlist.component.html',
})
export class WishlistComponent implements OnInit {
  private productSvc = inject(ProductService);
  private cartSvc = inject(CartService);
  private cartStore = inject(CartStore);
  wishlistStore = inject(WishlistStore);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);
  private reviewSvc = inject(ReviewService);

  products = signal<Product[]>([]);
  statsMap = signal<Record<number, ReviewStats>>({});
  categoryMap = signal<Record<number, string>>({});

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const userId = this.auth.currentUser()!.id;
    this.wishlistStore.refresh(userId).subscribe((ids) => {
      if (!ids.length) { this.products.set([]); return; }
      forkJoin(ids.map((id) => this.productSvc.getProductById(id))).subscribe((list) => {
        const products = list.filter((p): p is Product => !!p);
        this.products.set(products);
        this.reviewSvc.getStatsForAll().subscribe((stats) => this.statsMap.set(stats));
        this.productSvc.getAllCategories().subscribe((cats) => {
          this.categoryMap.set(Object.fromEntries(cats.map((c) => [c.id, c.name])));
        });
      });
    });
  }

  statsFor(productId: number): ReviewStats {
    return this.statsMap()[productId] ?? { avg: 0, count: 0 };
  }

  categoryName(categoryId: number): string {
    return this.categoryMap()[categoryId] ?? '—';
  }

  remove(product: Product): void {
    const userId = this.auth.currentUser()!.id;
    this.wishlistStore.toggle(userId, product.id);
    this.products.update((list) => list.filter((p) => p.id !== product.id));
    this.toast.show('Removed from wishlist.', 'info');
  }

  addToCart(product: Product): void {
    const userId = this.auth.currentUser()!.id;
    this.cartSvc.addToCart(userId, product.id).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      if (result.success) this.cartStore.refresh(userId).subscribe();
    });
  }
}
