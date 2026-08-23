import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { OrderRepository } from '../repositories/order.repository';
import { extractErrorMessage, toResult } from '../utils/http-result.utils';
import { Order, OrderFilters, OrderStatus, Result } from '../models';

/**
 * Thin now — stock deduction/restoration, status-transition validation, and notification triggers all
 * moved server-side (see ShopEase.Api's OrderService). This class just adapts the API's raw responses
 * into the Result<T> shape existing components expect; filterOrders() stays a pure client-side helper.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private repo = inject(OrderRepository);

  getAllOrders(): Observable<Order[]> {
    return this.repo.getAll();
  }

  getOrderById(id: number): Observable<Order | null> {
    return this.repo.getById(id);
  }

  // userId is accepted for interface parity, but the backend's /orders/mine is always the caller's own
  // orders (derived from the JWT) — every call site already passes the logged-in user's own id.
  getOrdersByUserId(_userId: number): Observable<Order[]> {
    return this.repo.getMine();
  }

  placeOrder(userId: number, addressId: number, paymentMethodId: number): Observable<Result<Order>> {
    return toResult(this.repo.place(addressId, paymentMethodId), 'Order placed successfully!');
  }

  updateOrderStatus(orderId: number, newStatus: OrderStatus): Observable<Result> {
    return this.toMessageResult(this.repo.updateStatus(orderId, newStatus));
  }

  cancelOrder(orderId: number, _userId: number): Observable<Result> {
    return this.toMessageResult(this.repo.cancel(orderId));
  }

  returnOrder(orderId: number, _userId: number): Observable<Result> {
    return this.toMessageResult(this.repo.returnOrder(orderId));
  }

  filterOrders(orders: Order[], filters: OrderFilters = {}): Order[] {
    let result = [...orders];
    if (filters.status) result = result.filter((o) => o.status === filters.status);
    if (filters.customerId) result = result.filter((o) => o.userId === filters.customerId);
    if (filters.dateFrom) { const from = new Date(filters.dateFrom); result = result.filter((o) => new Date(o.createdAt) >= from); }
    if (filters.dateTo) { const to = new Date(filters.dateTo); to.setHours(23, 59, 59); result = result.filter((o) => new Date(o.createdAt) <= to); }
    if (filters.minAmount !== undefined && filters.minAmount !== '') result = result.filter((o) => o.total >= parseFloat(String(filters.minAmount)));
    if (filters.maxAmount !== undefined && filters.maxAmount !== '') result = result.filter((o) => o.total <= parseFloat(String(filters.maxAmount)));
    return result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  getOrderStatuses(): Observable<{ id: number; name: string }[]> {
    return this.repo.getStatuses().pipe(map((names) => names.map((name, i) => ({ id: i + 1, name }))));
  }

  setOrderCustomFields(orderId: number, custom: Record<string, unknown>): Observable<Result> {
    return this.toMessageResult(this.repo.setCustomFields(orderId, custom));
  }

  /** Unlike toVoidResult, this surfaces the server's own dynamic message (e.g. "Order status updated to Shipped."). */
  private toMessageResult(source: Observable<{ message: string }>): Observable<Result> {
    return source.pipe(
      map((r) => ({ success: true, message: r.message }) as Result),
      catchError((err: unknown) => of({ success: false, message: extractErrorMessage(err) } as Result)),
    );
  }
}
