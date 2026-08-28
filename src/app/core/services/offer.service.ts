import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Offer, OfferFilter, OfferPdfOverrides, OfferUpdateCommand, OfferUpdateStatusCommand } from '../models/offer.model';
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

  generatePdf(id: number, overrides: OfferPdfOverrides): Observable<Blob> {
    let params = new HttpParams();
    if (overrides.date) params = params.set('date', overrides.date);
    if (overrides.venue) params = params.set('venue', overrides.venue);
    if (overrides.guests != null) params = params.set('guests', overrides.guests);
    if (overrides.colors) params = params.set('colors', overrides.colors);
    if (overrides.mainTable) params = params.set('mainTable', overrides.mainTable);
    if (overrides.guestsTable) params = params.set('guestsTable', overrides.guestsTable);
    if (overrides.flowers) params = params.set('flowers', overrides.flowers);
    if (overrides.description) params = params.set('description', overrides.description);
    return this.http.get(`${this.baseUrl}/${id}/pdf`, { params, responseType: 'blob' });
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
