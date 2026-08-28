import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MailConnectionStatus } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class MailIntegrationService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.serverUrl}/api/integrations`;

  getStatus(): Observable<MailConnectionStatus> {
    return this.http.get<MailConnectionStatus>(`${this.baseUrl}/mail/status`);
  }

  getGoogleAuthorizationUrl(): Observable<{ authorizationUrl: string }> {
    return this.http.get<{ authorizationUrl: string }>(`${this.baseUrl}/google/connect`);
  }

  disconnect(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/mail`);
  }
}
