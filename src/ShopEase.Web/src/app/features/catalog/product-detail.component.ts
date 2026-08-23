import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CartStore } from '../../core/stores/cart.store';
import { WishlistStore } from '../../core/stores/wishlist.store';
import { AuthStore } from '../../core/stores/auth.store';
import { ToastService } from '../../core/services/toast.service';
import { ReviewService } from './review.service';
import { Category, Product, Review, ReviewStats } from '../../core/models';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { formatDate } from '../../core/utils/format.utils';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StarRatingComponent],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productSvc = inject(ProductService);
  private cartSvc = inject(CartService);
  private cartStore = inject(CartStore);
  wishlistStore = inject(WishlistStore);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);
  private reviewSvc = inject(ReviewService);

  product = signal<Product | null | undefined>(undefined); // undefined = loading, null = not found
  category = signal<Category | null>(null);
  quantity = signal(1);
  stats = signal<ReviewStats>({ avg: 0, count: 0 });
  reviews = signal<Review[]>([]);
  alreadyReviewed = signal(false);
  related = signal<(Product & { stats: ReviewStats })[]>([]);
  selectedRating = signal(0);
  reviewComment = signal('');

  ngOnInit(): void {
    this.reviewSvc.ensureSeeded().subscribe(() => this.loadProduct());
  }

  private loadProduct(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productSvc.getProductById(id).subscribe((product) => {
      this.product.set(product);
      if (!product) return;

      this.productSvc.getCategoryById(product.categoryId).subscribe((cat) => this.category.set(cat));
      this.quantity.set(1);
      this.loadReviews(product.id);

      this.productSvc.getAllProducts().subscribe((all) => {
        const relatedProducts = all.filter((p) => p.categoryId === product.categoryId && p.id !== product.id && p.isActive).slice(0, 4);
        relatedProducts.forEach((p) => {
          this.reviewSvc.getStats(p.id).subscribe((s) => {
            this.related.update((list) => [...list.filter((x) => x.id !== p.id), { ...p, stats: s }].sort((a, b) => relatedProducts.findIndex((r) => r.id === a.id) - relatedProducts.findIndex((r) => r.id === b.id)));
          });
        });
      });
    });
  }

  private loadReviews(productId: number): void {
    const userId = this.auth.currentUser()!.id;
    this.reviewSvc.getForProduct(productId).subscribe((reviews) => this.reviews.set(reviews));
    this.reviewSvc.getStats(productId).subscribe((s) => this.stats.set(s));
    this.reviewSvc.hasReviewed(userId, productId).subscribe((v) => this.alreadyReviewed.set(v));
  }

  decrementQty(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  incrementQty(): void {
    const stock = this.product()?.stock ?? 1;
    this.quantity.update((q) => Math.min(stock, q + 1));
  }

  addToCart(): void {
    const product = this.product();
    if (!product) return;
    const userId = this.auth.currentUser()!.id;
    this.cartSvc.addToCart(userId, product.id, this.quantity()).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      if (result.success) this.cartStore.refresh(userId).subscribe();
    });
  }

  toggleWishlist(): void {
    const product = this.product();
    if (!product) return;
    const userId = this.auth.currentUser()!.id;
    const wasInWishlist = this.wishlistStore.has(product.id);
    this.wishlistStore.toggle(userId, product.id);
    this.toast.show(wasInWishlist ? 'Removed from wishlist.' : 'Added to wishlist.', wasInWishlist ? 'info' : 'success');
  }

  setRating(n: number): void {
    this.selectedRating.set(n);
  }

  formatDate = formatDate;

  submitReview(): void {
    const product = this.product();
    if (!product) return;
    if (this.selectedRating() === 0) {
      this.toast.show('Please select a star rating.', 'error');
      return;
    }
    const user = this.auth.currentUser()!;
    this.reviewSvc.add({ productId: product.id, userId: user.id, userName: user.name, rating: this.selectedRating(), comment: this.reviewComment().trim() }).subscribe(() => {
      this.toast.show('Thanks for your review!', 'success');
      this.selectedRating.set(0);
      this.reviewComment.set('');
      this.loadReviews(product.id);
    });
  }
}
