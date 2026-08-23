import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { PaymentRepository } from '../repositories/payment.repository';
import { LookupRepository } from '../repositories/lookup.repository';
import { extractErrorMessage } from '../utils/http-result.utils';
import { Payment, PaymentDetailsInput, PaymentFilters, PaymentMethod, PaymentMethodName, Result } from '../models';

/**
 * Thin now — the random success/failure simulation, card/UPI masking, and completion/failure
 * notifications all moved server-side (see ShopEase.Api's PaymentService + the Razorpay-simulator
 * gateway behind a Polly retry/circuit-breaker pipeline). The API always responds 200 with the
 * Payment record even on a gateway failure (status ends up "Pending", not a hard error) — this class
 * just derives the Result<T> shape existing components expect from that record's status.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private repo = inject(PaymentRepository);
  private lookups = inject(LookupRepository);

  getAllPayments(): Observable<Payment[]> {
    return this.repo.getAll();
  }

  // userId is accepted for interface parity — the backend's /payments/mine is always the caller's own.
  getPaymentsByUserId(_userId: number): Observable<Payment[]> {
    return this.repo.getMine();
  }

  getPaymentByOrderId(orderId: number): Observable<Payment | null> {
    return this.repo.getByOrderId(orderId);
  }

  processPayment(
    orderId: number, _userId: number, method: PaymentMethodName, amount: number, details: PaymentDetailsInput = {},
  ): Observable<Result<Payment>> {
    return this.repo.process(orderId, method, amount, details).pipe(
      map((payment) => ({
        success: payment.status === 'Completed' || payment.status === 'Pending',
        message: payment.status === 'Completed' ? 'Payment successful!' : payment.status === 'Pending'
          ? "Payment could not be confirmed right now — it's marked pending for reconciliation."
          : 'Payment failed. Please try again.',
        data: payment,
      }) as Result<Payment>),
      catchError((err: unknown) => of({ success: false, message: extractErrorMessage(err) } as Result<Payment>)),
    );
  }

  filterPayments(payments: Payment[], filters: PaymentFilters = {}): Payment[] {
    let result = [...payments];
    if (filters.method) result = result.filter((p) => p.method === filters.method);
    if (filters.status) result = result.filter((p) => p.status === filters.status);
    if (filters.dateFrom) { const from = new Date(filters.dateFrom); result = result.filter((p) => new Date(p.createdAt) >= from); }
    if (filters.dateTo) { const to = new Date(filters.dateTo); to.setHours(23, 59, 59); result = result.filter((p) => new Date(p.createdAt) <= to); }
    if (filters.minAmount !== undefined && filters.minAmount !== '') result = result.filter((p) => p.amount >= parseFloat(String(filters.minAmount)));
    if (filters.maxAmount !== undefined && filters.maxAmount !== '') result = result.filter((p) => p.amount <= parseFloat(String(filters.maxAmount)));
    return result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.lookups.getPaymentMethods();
  }

  getPaymentStatuses(): Observable<{ id: number; name: string }[]> {
    return this.lookups.getPaymentStatuses();
  }
}
