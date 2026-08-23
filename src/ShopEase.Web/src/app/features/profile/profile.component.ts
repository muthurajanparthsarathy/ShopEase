import { AfterViewInit, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/stores/auth.store';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { fieldPattern, firstErrorMessage } from '../../core/validators/field.validators';
import { Address, User } from '../../core/models';

declare const bootstrap: any;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private authStore = inject(AuthStore);
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);

  @ViewChild('addressModalEl') addressModalEl!: ElementRef<HTMLDivElement>;
  private modal: any;

  fullUser = signal<User | null>(null);
  userId = computed(() => this.authStore.currentUser()!.id);
  profileSubmitted = signal(false);
  addressSubmitted = signal(false);
  editingAddressId = signal<number | null>(null);
  modalTitle = computed(() => (this.editingAddressId() ? 'Edit Address' : 'Add Address'));

  profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, fieldPattern('name')]],
    phone: ['', [Validators.required, fieldPattern('phone')]],
  });

  addressForm = this.fb.nonNullable.group({
    label: ['', [Validators.required, fieldPattern('label')]],
    line: ['', [Validators.required, fieldPattern('addressLine')]],
    city: ['', [Validators.required, fieldPattern('city')]],
    state: ['', [Validators.required, fieldPattern('state')]],
    postalCode: ['', [Validators.required, fieldPattern('postalCode')]],
  });

  profileErrorFor = (name: keyof typeof this.profileForm.controls) => firstErrorMessage(this.profileForm.get(name));
  addressErrorFor = (name: keyof typeof this.addressForm.controls) => firstErrorMessage(this.addressForm.get(name));

  constructor() {
    this.load();
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.addressModalEl.nativeElement);
  }

  private load(): void {
    this.authSvc.getUserById(this.userId()).subscribe((user) => {
      this.fullUser.set(user);
      if (user) this.profileForm.patchValue({ name: user.name, phone: user.phone });
    });
  }

  saveProfile(): void {
    this.profileSubmitted.set(true);
    if (this.profileForm.invalid) return;
    const { name, phone } = this.profileForm.getRawValue();
    this.authSvc.updateProfile(this.userId(), { name: name.trim(), phone: phone.trim() }).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        this.authStore.updateName(name.trim());
        this.load();
      }
    });
  }

  openAddAddress(): void {
    this.editingAddressId.set(null);
    this.addressForm.reset();
    this.addressSubmitted.set(false);
  }

  openEditAddress(addr: Address): void {
    this.editingAddressId.set(addr.id);
    this.addressSubmitted.set(false);
    this.addressForm.setValue({ label: addr.label, line: addr.line, city: addr.city, state: addr.state, postalCode: addr.postalCode });
    this.modal.show();
  }

  saveAddress(): void {
    this.addressSubmitted.set(true);
    if (this.addressForm.invalid) return;
    const data = this.addressForm.getRawValue();
    const addrData = { label: data.label.trim(), line: data.line.trim(), city: data.city.trim(), state: data.state.trim(), postalCode: data.postalCode.trim() };
    const editId = this.editingAddressId();
    const onDone = (result: { success: boolean; message: string }) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        this.modal.hide();
        this.load();
      }
    };

    if (editId) this.authSvc.updateAddress(this.userId(), editId, addrData).subscribe(onDone);
    else this.authSvc.addAddress(this.userId(), addrData).subscribe(onDone);
  }

  async deleteAddress(addr: Address): Promise<void> {
    const ok = await this.toast.confirm(`Delete the "${addr.label}" address?`, 'danger');
    if (!ok) return;
    this.authSvc.deleteAddress(this.userId(), addr.id).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      this.load();
    });
  }

  setDefault(addr: Address): void {
    this.authSvc.setDefaultAddress(this.userId(), addr.id).subscribe(() => {
      this.toast.show('Default address updated.', 'success');
      this.load();
    });
  }
}
