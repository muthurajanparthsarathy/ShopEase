import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/stores/auth.store';
import { LoaderService } from '../../core/services/loader.service';
import { fieldPattern, firstErrorMessage } from '../../core/validators/field.validators';
import { RoleId } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthStore);
  private loader = inject(LoaderService);
  private router = inject(Router);

  showPassword = signal(false);
  errorMessage = signal('');
  submitted = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, fieldPattern('email')]],
    password: ['', [Validators.required]],
  });

  errorFor = (name: keyof typeof this.form.controls) => firstErrorMessage(this.form.get(name));

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.errorMessage.set('');
    if (this.form.invalid) return;

    const { email, password } = this.form.getRawValue();
    const result = await this.loader.run(this.auth.login(email.trim(), password), { message: 'Signing in…' });

    if (result.success && result.data) {
      this.router.navigate([result.data.roleId === RoleId.Admin ? '/admin/dashboard' : '/home']);
    } else {
      this.errorMessage.set(result.message);
    }
  }
}
