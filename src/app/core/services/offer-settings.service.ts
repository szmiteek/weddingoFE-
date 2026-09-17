import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OfferSettings, OfferSettingsUpdateCommand } from '../models/offer-settings.model';

@Injectable({ providedIn: 'root' })
export class OfferSettingsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/offer-settings`;

  get(): Observable<OfferSettings> {
    return this.http.get<OfferSettings>(this.baseUrl);
  }

  update(command: OfferSettingsUpdateCommand): Observable<OfferSettings> {
    return this.http.put<OfferSettings>(this.baseUrl, command);
  }

  uploadLogo(file: File): Observable<OfferSettings> {
    const form = new FormData();
    form.append('logo', file);
    return this.http.post<OfferSettings>(`${this.baseUrl}/logo`, form);
  }

  /** The logo endpoint needs the auth header, so it's fetched as a blob rather than used as an <img> URL. */
  fetchLogo(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/logo`, { responseType: 'blob' });
  }

  deleteLogo(): Observable<OfferSettings> {
    return this.http.delete<OfferSettings>(`${this.baseUrl}/logo`);
  }

  uploadCoverPdf(file: File): Observable<OfferSettings> {
    const form = new FormData();
    form.append('coverPdf', file);
    return this.http.post<OfferSettings>(`${this.baseUrl}/cover-pdf`, form);
  }

  fetchCoverPdf(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/cover-pdf`, { responseType: 'blob' });
  }

  deleteCoverPdf(): Observable<OfferSettings> {
    return this.http.delete<OfferSettings>(`${this.baseUrl}/cover-pdf`);
  }
}
