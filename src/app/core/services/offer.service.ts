import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Offer,
  OfferFilter,
  OfferPdfField,
  OfferPdfOverrides,
  OfferUpdateCommand,
  OfferUpdateStatusCommand,
} from '../models/offer.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class OfferService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/offer`;

  getAll(page: number, size = 15, sort = 'id,desc', filter?: OfferFilter): Observable<Page<Offer>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        if (value) {
          params = params.set(key, value);
        }
      }
    }
    return this.http.get<Page<Offer>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Offer> {
    return this.http.get<Offer>(`${this.baseUrl}/${id}`);
  }

  /** The fields chosen in the offer settings, pre-filled from this offer — step 1 of the PDF modal. */
  getPdfFields(id: number): Observable<OfferPdfField[]> {
    return this.http.get<OfferPdfField[]>(`${this.baseUrl}/${id}/pdf/fields`);
  }

  generatePdf(id: number, overrides: OfferPdfOverrides): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/${id}/pdf`, overrides, { responseType: 'blob' });
  }

  downloadSavedPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf/download`, { responseType: 'blob' });
  }

  update(id: number, command: OfferUpdateCommand): Observable<Offer> {
    return this.http.put<Offer>(`${this.baseUrl}/${id}`, command);
  }

  updateStatus(id: number, command: OfferUpdateStatusCommand): Observable<Offer> {
    return this.http.patch<Offer>(`${this.baseUrl}/${id}`, command);
  }

  sendEmail(id: number, email?: string): Observable<Offer> {
    return this.http.post<Offer>(`${this.baseUrl}/${id}/send`, email ? { email } : {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
