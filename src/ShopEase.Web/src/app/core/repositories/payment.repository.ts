import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment, PaymentDetailsInput, PaymentMethodName } from '../models';

@Injectable()
export abstract class PaymentRepository {
  abstract getAll(): Observable<Payment[]>;
  abstract getMine(): Observable<Payment[]>;
  abstract getByOrderId(orderId: number): Observable<Payment | null>;
  abstract process(orderId: number, method: PaymentMethodName, amount: number, details: PaymentDetailsInput): Observable<Payment>;
}

const BASE = `${environment.apiUrl}/payments`;

@Injectable()
export class HttpPaymentRepository extends PaymentRepository {
  private http = inject(HttpClient);

  override getAll(): Observable<Payment[]> {
    return this.http.get<Payment[]>(BASE);
  }

  override getMine(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${BASE}/mine`);
  }

  override getByOrderId(orderId: number): Observable<Payment | null> {
    return this.http.get<Payment>(`${BASE}/order/${orderId}`);
  }

  override process(orderId: number, method: PaymentMethodName, amount: number, details: PaymentDetailsInput): Observable<Payment> {
    return this.http.post<Payment>(BASE, {
      orderId, method, amount,
      cardNumber: details.cardNumber, cardHolder: details.cardHolder, upiId: details.upiId,
    });
  }
}
