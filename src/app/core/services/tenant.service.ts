import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tenant, TenantCreateCommand } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tenants`;

  getAll(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(this.baseUrl);
  }

  create(command: TenantCreateCommand): Observable<Tenant> {
    return this.http.post<Tenant>(this.baseUrl, command);
  }

  setActive(id: number, active: boolean): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.baseUrl}/${id}/status`, { active });
  }
}
