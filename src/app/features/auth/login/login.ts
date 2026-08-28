import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  protected loading = signal(false);

  protected form = this.fb.nonNullable.group({
    email: [''],
    password: [''],
  });

  submit(): void {
    this.loading.set(true);
    this.authService.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.router.navigate([response.role === 'SUPER_ADMIN' ? '/tenants' : '/dashboard']);
      },
      error: () => this.loading.set(false),
    });
  }
}
