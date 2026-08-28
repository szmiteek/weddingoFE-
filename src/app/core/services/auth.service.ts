import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChangePasswordCommand,
  LoginCommand,
  LoginResponse,
  Tenant,
  TenantEmailSettings,
  TenantEmailSettingsUpdateCommand,
} from '../models/auth.model';

const STORAGE_KEY = 'auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly session = signal<LoginResponse | null>(readStoredSession());

  readonly currentUser = this.session.asReadonly();

  login(command: LoginCommand): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, command).pipe(
      tap((response) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
        this.session.set(response);
      }),
    );
  }

  changePassword(command: ChangePasswordCommand): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/password`, command);
  }

  regeneratePublicFormToken(): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.baseUrl}/public-form-token/regenerate`, {}).pipe(
      tap((tenant) => {
        const current = this.session();
        if (current) {
          const updated = { ...current, publicFormToken: tenant.publicFormToken };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          this.session.set(updated);
        }
      }),
    );
  }

  getEmailSettings(): Observable<TenantEmailSettings> {
    return this.http.get<TenantEmailSettings>(`${this.baseUrl}/email-settings`);
  }

  updateEmailSettings(command: TenantEmailSettingsUpdateCommand): Observable<TenantEmailSettings> {
    return this.http.patch<TenantEmailSettings>(`${this.baseUrl}/email-settings`, command);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  token(): string | null {
    return this.session()?.token ?? null;
  }

  isAuthenticated(): boolean {
    return this.session() !== null;
  }

  isSuperAdmin(): boolean {
    return this.session()?.role === 'SUPER_ADMIN';
  }
}

function readStoredSession(): LoginResponse | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as LoginResponse;
  } catch {
    return null;
  }
}
