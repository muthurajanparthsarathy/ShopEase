import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { CustomFieldService } from '../../../core/services/custom-field.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderFilters, OrderStatus, Payment, User } from '../../../core/models';
import { paginate, PageResult } from '../../../core/utils/pagination.utils';
import { formatCurrency, formatDate, statusBadgeClass } from '../../../core/utils/format.utils';
import { CustomFieldsFormComponent } from '../../../shared/components/custom-fields-form/custom-fields-form.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

declare const bootstrap: any;

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Processing', 'Cancelled'], Processing: ['Shipped', 'Cancelled'], Shipped: ['Delivered'],
  Delivered: [], Cancelled: [], Returned: [],
};
const TIMELINE_STEPS: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered'];

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomFieldsFormComponent, PaginationComponent],
  templateUrl: './orders.component.html',
})
export class AdminOrdersComponent implements AfterViewInit {
  private orderSvc = inject(OrderService);
  private paymentSvc = inject(PaymentService);
  private authSvc = inject(AuthService);
  private customFieldSvc = inject(CustomFieldService);
  private toast = inject(ToastService);

  @ViewChild('orderModalEl') orderModalEl!: ElementRef<HTMLDivElement>;
  @ViewChild(CustomFieldsFormComponent) cfForm?: CustomFieldsFormComponent;
  private orderModal: any;

  statuses = signal<{ id: number; name: string }[]>([]);
  allOrders = signal<Order[]>([]);
  customers = signal<User[]>([]);
  paged = signal<PageResult<Order>>({ items: [], currentPage: 1, totalPages: 1, totalItems: 0, perPage: 8, hasNext: false, hasPrev: false });

  page = signal(1);
  perPage = signal(8);
  filterStatus = signal('');
  filterFrom = signal('');
  filterTo = signal('');
  filterMin = signal('');
  filterMax = signal('');

  selectedOrder = signal<Order | null>(null);
  selectedPayment = signal<Payment | null>(null);
  hasCustomFields = signal(false);

  statusBadgeClass = statusBadgeClass;
  formatCurrency = formatCurrency;
  formatDate = formatDate;

  constructor() {
    this.orderSvc.getOrderStatuses().subscribe((s) => this.statuses.set(s));
    this.authSvc.getAllCustomers().subscribe((c) => this.customers.set(c));
    this.customFieldSvc.getForEntity('order').subscribe((fields) => this.hasCustomFields.set(fields.length > 0));
    this.reload();
  }

  ngAfterViewInit(): void {
    this.orderModal = new bootstrap.Modal(this.orderModalEl.nativeElement);
  }

  private reload(): void {
    this.orderSvc.getAllOrders().subscribe((all) => { this.allOrders.set(all); this.applyFilters(); });
  }

  customerName(userId: number): string {
    return this.customers().find((c) => c.id === userId)?.name ?? 'Unknown';
  }
  customerEmail(userId: number): string {
    return this.customers().find((c) => c.id === userId)?.email ?? '';
  }

  applyFilters(): void {
    const filters: OrderFilters = { status: this.filterStatus(), dateFrom: this.filterFrom(), dateTo: this.filterTo(), minAmount: this.filterMin(), maxAmount: this.filterMax() };
    const filtered = this.orderSvc.filterOrders(this.allOrders(), filters);
    this.paged.set(paginate(filtered, this.page(), this.perPage()));
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.applyFilters();
  }


  clearFilters(): void {
    this.filterStatus.set(''); this.filterFrom.set(''); this.filterTo.set(''); this.filterMin.set(''); this.filterMax.set('');
    this.page.set(1);
    this.applyFilters();
    this.toast.show('Filters cleared.', 'info');
  }

  canCancel(o: Order): boolean {
    return o.status !== 'Delivered' && o.status !== 'Cancelled';
  }

  timelineSteps() {
    const order = this.selectedOrder();
    if (!order) return [];
    const currentIdx = TIMELINE_STEPS.indexOf(order.status);
    return TIMELINE_STEPS.map((s, i) => {
      let cls = '';
      if (order.status === 'Cancelled') cls = i === 0 ? 'cancelled' : '';
      else if (i < currentIdx) cls = 'completed';
      else if (i === currentIdx) cls = 'active';
      return { label: s, cls, icon: i <= currentIdx && order.status !== 'Cancelled' ? 'check' : 'circle' };
    });
  }

  allowedTransitions(): OrderStatus[] {
    return VALID_TRANSITIONS[this.selectedOrder()?.status ?? 'Delivered'] ?? [];
  }

  viewOrder(order: Order): void {
    this.selectedOrder.set(order);
    this.paymentSvc.getPaymentByOrderId(order.id).subscribe((p) => this.selectedPayment.set(p));
    this.orderModal.show();
  }

  saveCustomFields(): void {
    const order = this.selectedOrder();
    if (!order || !this.cfForm) return;
    const { values, errors } = this.cfForm.getResult();
    if (errors.length) { this.toast.show('Please fill required: ' + errors.join(', '), 'error'); return; }
    this.orderSvc.setOrderCustomFields(order.id, values).subscribe((result) => this.toast.show(result.message, result.success ? 'success' : 'error'));
  }

  async updateStatus(newStatus: OrderStatus): Promise<void> {
    const order = this.selectedOrder();
    if (!order) return;
    const ok = await this.toast.confirm(`Update order status to "${newStatus}"?`, newStatus === 'Cancelled' ? 'danger' : 'warning');
    if (!ok) return;
    this.orderSvc.updateOrderStatus(order.id, newStatus).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      if (result.success) { this.orderModal.hide(); this.reload(); }
    });
  }

  async cancelOrder(order: Order): Promise<void> {
    const ok = await this.toast.confirm(`Cancel order "${order.orderNumber}"?`, 'danger');
    if (!ok) return;
    this.orderSvc.updateOrderStatus(order.id, 'Cancelled').subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      if (result.success) this.reload();
    });
  }
}
