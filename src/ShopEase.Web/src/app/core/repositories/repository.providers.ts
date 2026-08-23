import { Provider } from '@angular/core';
import { ProductRepository, HttpProductRepository } from './product.repository';
import { CategoryRepository, HttpCategoryRepository } from './category.repository';
import { OrderRepository, HttpOrderRepository } from './order.repository';
import { PaymentRepository, HttpPaymentRepository } from './payment.repository';
import { NotificationRepository, HttpNotificationRepository } from './notification.repository';
import { CartRepository, HttpCartRepository } from './cart.repository';
import { WishlistRepository, HttpWishlistRepository } from './wishlist.repository';
import { ReviewRepository, HttpReviewRepository } from './review.repository';
import { CouponRepository, HttpCouponRepository } from './coupon.repository';
import { CmsRepository, HttpCmsRepository } from './cms.repository';
import { CustomFieldRepository, HttpCustomFieldRepository } from './custom-field.repository';
import { LogRepository, HttpLogRepository } from './log.repository';
import { LookupRepository, HttpLookupRepository } from './lookup.repository';

/** Every entity's data-access contract, now bound to its HTTP implementation (ShopEase.Api). */
export const REPOSITORY_PROVIDERS: Provider[] = [
  { provide: ProductRepository, useClass: HttpProductRepository },
  { provide: CategoryRepository, useClass: HttpCategoryRepository },
  { provide: OrderRepository, useClass: HttpOrderRepository },
  { provide: PaymentRepository, useClass: HttpPaymentRepository },
  { provide: NotificationRepository, useClass: HttpNotificationRepository },
  { provide: CartRepository, useClass: HttpCartRepository },
  { provide: WishlistRepository, useClass: HttpWishlistRepository },
  { provide: ReviewRepository, useClass: HttpReviewRepository },
  { provide: CouponRepository, useClass: HttpCouponRepository },
  { provide: CmsRepository, useClass: HttpCmsRepository },
  { provide: CustomFieldRepository, useClass: HttpCustomFieldRepository },
  { provide: LogRepository, useClass: HttpLogRepository },
  { provide: LookupRepository, useClass: HttpLookupRepository },
];
