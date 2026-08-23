import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../core/stores/auth.store';
import { AuthService } from '../../core/services/auth.service';
import { CartStore } from '../../core/stores/cart.store';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { ToastService } from '../../core/services/toast.service';
import { LoaderService } from '../../core/services/loader.service';
import { fieldPattern, firstErrorMessage } from '../../core/validators/field.validators';
import { Address, Order, PaymentMethod, PaymentMethodName } from '../../core/models';

type FormType = 'card' | 'upi' | 'cod' | 'generic';

function formTypeFor(name: string): FormType {
  if (/card/i.test(name)) return 'card';
  if (/upi/i.test(name)) return 'upi';
  if (/cash on delivery|cod/i.test(name)) return 'cod';
  return 'generic';
}

function methodIcon(name: string): string {
  if (/card/i.test(name)) return 'credit-card';
  if (/upi/i.test(name)) return 'phone';
  if (/cash on delivery|cod/i.test(name)) return 'cash-stack';
  return 'wallet2';
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthStore);
  private authSvc = inject(AuthService);
  cartStore = inject(CartStore);
  private orderSvc = inject(OrderService);
  private paymentSvc = inject(PaymentService);
  private toast = inject(ToastService);
  private loader = inject(LoaderService);
  private router = inject(Router);

  addresses = signal<Address[]>([]);
  selectedAddressId = signal<number | null>(null);
  paymentMethods = signal<PaymentMethod[]>([]);
  selectedMethod = signal<PaymentMethod | null>(null);
  submitted = signal(false);
  placedOrder = signal<Order | null>(null);

  formTypeFor = formTypeFor;
  methodIcon = methodIcon;

  cardForm = this.fb.nonNullable.group({
    cardNumber: ['', [Validators.required, fieldPattern('creditCard')]],
    cardHolder: ['', [Validators.required]],
    expiry: ['', [Validators.required, fieldPattern('cardExpiry')]],
    cvv: ['', [Validators.required, fieldPattern('cvv')]],
  });

  upiForm = this.fb.nonNullable.group({
    upiId: ['', [Validators.required, fieldPattern('upiId')]],
  });

  cardErrorFor = (name: keyof typeof this.cardForm.controls) => firstErrorMessage(this.cardForm.get(name));
  upiErrorFor = (name: keyof typeof this.upiForm.controls) => firstErrorMessage(this.upiForm.get(name));

  private get userId() { return this.auth.currentUser()!.id; }

  ngOnInit(): void {
    this.cartStore.refresh(this.userId).subscribe((summary) => {
      if (summary.items.length === 0) this.router.navigate(['/cart']);
    });

    this.authSvc.getUserById(this.userId).subscribe((user) => {
      const addresses = user?.addresses ?? [];
      this.addresses.set(addresses);
      this.selectedAddressId.set(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null);
    });

    this.paymentSvc.getPaymentMethods().subscribe((methods) => {
      this.paymentMethods.set(methods);
      this.selectedMethod.set(methods[0] ?? null);
    });
  }

  onCardNumberInput(value: string): void {
    let val = value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.cardForm.controls.cardNumber.setValue(val, { emitEvent: false });
  }

  async placeOrder(): Promise<void> {
    if (!this.selectedAddressId()) { this.toast.show('Please select a delivery address.', 'error'); return; }
    const method = this.selectedMethod();
    if (!method) { this.toast.show('Please select a payment method.', 'error'); return; }

    const ftype = formTypeFor(method.name);
    this.submitted.set(true);

    let details: Record<string, string> = {};
    if (ftype === 'card') {
      if (this.cardForm.invalid) return;
      const v = this.cardForm.getRawValue();
      details = { cardNumber: v.cardNumber.replace(/\s/g, ''), cardHolder: v.cardHolder };
    } else if (ftype === 'upi') {
      if (this.upiForm.invalid) return;
      details = { upiId: this.upiForm.getRawValue().upiId };
    }

    const summary = this.cartStore.summary();
    const addressId = this.selectedAddressId()!;

    const result = await this.loader.run(
      firstValueFrom(this.orderSvc.placeOrder(this.userId, addressId, method.id)),
      { message: 'Processing your order…', progressMessage: 'Fetching data… almost there' },
    );

    if (!result.success || !result.data) {
      this.toast.show(result.message ?? 'An error occurred. Please try again.', 'error');
      return;
    }

    const order = result.data;
    if (ftype !== 'cod') {
      this.loader.setMessage('Processing payment…');
      await firstValueFrom(this.paymentSvc.processPayment(order.id, this.userId, method.name as PaymentMethodName, summary.total, details));
    }

    this.placedOrder.set(order);
  }
}
