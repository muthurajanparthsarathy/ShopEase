import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { CartService } from '../../core/services/cart.service';
import { CartStore } from '../../core/stores/cart.store';
import { AuthStore } from '../../core/stores/auth.store';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Order, OrderFilters, OrderStatus, Payment, User } from '../../core/models';
import { paginate, PageResult } from '../../core/utils/pagination.utils';
import { statusBadgeClass, formatDate, formatDateTime } from '../../core/utils/format.utils';
import { downloadInvoice } from './invoice.util';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

declare const bootstrap: any;

const CANCEL_TERMS = `
  <p class="fw-bold mb-2">Order Cancellation Policy</p>
  <ol class="mb-0 ps-3">
    <li>Orders can be cancelled only while they are in <strong>Pending</strong> status (before processing/dispatch).</li>
    <li>Once cancelled, the order cannot be reinstated; please place a new order if needed.</li>
    <li>Any amount paid will be <strong>refunded to the original payment method within 5–7 business days</strong>. Cash-on-Delivery orders have nothing to refund.</li>
    <li>Reserved stock for the cancelled items will be released back to inventory.</li>
    <li>Promotional discounts/coupons applied to the order will not be carried forward.</li>
  </ol>`;
const RETURN_TERMS = `
  <p class="fw-bold mb-2">Return Policy</p>
  <ol class="mb-0 ps-3">
    <li>Returns are accepted only for <strong>Delivered</strong> orders, within <strong>7 days</strong> of delivery.</li>
    <li>Items must be <strong>unused, undamaged</strong>, and in their original packaging with all tags/accessories.</li>
    <li>Refunds are issued <strong>after the returned item passes inspection</strong>, to the original payment method within 5–7 business days.</li>
    <li>Certain items (perishables, personal-care, final-sale) may not be eligible for return.</li>
    <li>Pickup/return shipping may be arranged; charges, if any, will be communicated.</li>
  </ol>`;

const TIMELINE_STEPS: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered'];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit, AfterViewInit {
  private orderSvc = inject(OrderService);
  private paymentSvc = inject(PaymentService);
  private cartSvc = inject(CartService);
  private cartStore = inject(CartStore);
  private auth = inject(AuthStore);
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);

  @ViewChild('orderModalEl') orderModalEl!: ElementRef<HTMLDivElement>;
  @ViewChild('termsModalEl') termsModalEl!: ElementRef<HTMLDivElement>;
  private orderModal: any;
  private termsModal: any;

  statuses = signal<{ id: number; name: string }[]>([]);
  myOrders = signal<Order[]>([]);
  page = signal(1);
  perPage = signal(6);
  paged = signal<PageResult<Order>>({ items: [], currentPage: 1, totalPages: 1, totalItems: 0, perPage: 6, hasNext: false, hasPrev: false });

  filterStatus = signal('');
  filterFrom = signal('');
  filterTo = signal('');
  filterMin = signal('');
  filterMax = signal('');

  selectedOrder = signal<Order | null>(null);
  selectedPayment = signal<Payment | null>(null);
  fullUser = signal<User | null>(null);

  termsType = signal<'cancel' | 'return'>('cancel');
  termsAgreed = signal(false);
  private pendingOrderId: number | null = null;

  statusBadgeClass = statusBadgeClass;
  formatDate = formatDate;
  formatDateTime = formatDateTime;

  private get userId() { return this.auth.currentUser()!.id; }

  ngOnInit(): void {
    this.orderSvc.getOrderStatuses().subscribe((s) => this.statuses.set(s));
    this.authSvc.getUserById(this.userId).subscribe((u) => this.fullUser.set(u));
    this.load();
  }

  ngAfterViewInit(): void {
    this.orderModal = new bootstrap.Modal(this.orderModalEl.nativeElement);
    this.termsModal = new bootstrap.Modal(this.termsModalEl.nativeElement);
  }

  private load(): void {
    this.orderSvc.getOrdersByUserId(this.userId).subscribe((orders) => {
      this.myOrders.set(orders);
      this.applyFilters();
    });
  }

  get termsBody(): string {
    return this.termsType() === 'cancel' ? CANCEL_TERMS : RETURN_TERMS;
  }

  applyFilters(): void {
    const filters: OrderFilters = {
      status: this.filterStatus(), dateFrom: this.filterFrom(), dateTo: this.filterTo(),
      minAmount: this.filterMin(), maxAmount: this.filterMax(),
    };
    const filtered = this.orderSvc.filterOrders(this.myOrders(), filters);
    this.paged.set(paginate(filtered, this.page(), this.perPage()));
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.applyFilters();
  }


  clearFilters(): void {
    this.filterStatus.set('');
    this.filterFrom.set('');
    this.filterTo.set('');
    this.filterMin.set('');
    this.filterMax.set('');
    this.page.set(1);
    this.applyFilters();
    this.toast.show('Filters cleared.', 'info');
  }

  viewOrder(order: Order): void {
    this.selectedOrder.set(order);
    this.paymentSvc.getPaymentByOrderId(order.id).subscribe((p) => this.selectedPayment.set(p));
    this.orderModal.show();
  }

  timelineSteps() {
    const order = this.selectedOrder();
    if (!order) return [];
    const isReturned = order.status === 'Returned';
    const currentIdx = isReturned ? TIMELINE_STEPS.length : TIMELINE_STEPS.indexOf(order.status);
    return TIMELINE_STEPS.map((s, i) => {
      let cls = '';
      if (order.status === 'Cancelled') cls = i === 0 ? 'cancelled' : '';
      else if (i < currentIdx) cls = 'completed';
      else if (i === currentIdx) cls = 'active';
      const icon = i <= currentIdx && order.status !== 'Cancelled' ? 'check' : 'circle';
      return { label: s, cls, icon };
    });
  }

  openTerms(type: 'cancel' | 'return', orderId: number): void {
    this.pendingOrderId = orderId;
    this.termsType.set(type);
    this.termsAgreed.set(false);
    this.termsModal.show();
  }

  confirmTermsAction(): void {
    if (!this.pendingOrderId) return;
    const orderId = this.pendingOrderId;
    const type = this.termsType();
    const obs = type === 'cancel' ? this.orderSvc.cancelOrder(orderId, this.userId) : this.orderSvc.returnOrder(orderId, this.userId);

    obs.subscribe((result) => {
      // Notification-on-status-change is now always a server-side side effect (both cancel and
      // return trigger it via ShopEase.Api's OrderService) — no client-side compensating call needed.
      this.termsModal.hide();
      this.pendingOrderId = null;
      this.toast.show(result.message, result.success ? 'success' : 'error');
      this.load();
    });
  }

  reorder(order: Order): void {
    let added = 0, failed = 0;
    let remaining = order.items.length;
    order.items.forEach((item) => {
      this.cartSvc.addToCart(this.userId, item.productId, item.quantity).subscribe((r) => {
        r.success ? added++ : failed++;
        remaining--;
        if (remaining === 0) {
          this.cartStore.refresh(this.userId).subscribe();
          if (added) this.toast.show(`${added} item(s) added to cart${failed ? `, ${failed} unavailable` : ''}.`, 'success');
          else this.toast.show('These items are currently unavailable for reorder.', 'error');
        }
      });
    });
  }

  invoice(order: Order): void {
    downloadInvoice(order, this.fullUser());
  }
}
