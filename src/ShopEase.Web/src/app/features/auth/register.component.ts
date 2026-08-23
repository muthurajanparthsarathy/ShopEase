import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/stores/auth.store';
import { LoaderService } from '../../core/services/loader.service';
import { fieldPattern, fieldsMatch, firstErrorMessage } from '../../core/validators/field.validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthStore);
  private loader = inject(LoaderService);
  private router = inject(Router);

  showPassword = signal(false);
  showConfirm = signal(false);
  errorMessage = signal('');
  submitted = signal(false);

  form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, fieldPattern('name')]],
      email: ['', [Validators.required, fieldPattern('email')]],
      phone: ['', [Validators.required, fieldPattern('phone')]],
      password: ['', [Validators.required, fieldPattern('password')]],
      confirm: ['', [Validators.required]],
    },
    { validators: [fieldsMatch('password', 'confirm', 'Passwords do not match')] },
  );

  errorFor = (name: keyof typeof this.form.controls) => firstErrorMessage(this.form.get(name));

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.errorMessage.set('');
    if (this.form.invalid) return;

    const { name, email, phone, password } = this.form.getRawValue();
    const result = await this.loader.run(
      this.auth.register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password }),
      { message: 'Creating your account…' },
    );

    if (result.success) {
      this.router.navigate(['/home']);
    } else {
      this.errorMessage.set(result.message);
    }
  }
}
