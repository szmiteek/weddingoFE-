import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OfferImage } from '../models/offer-image.model';

@Injectable({ providedIn: 'root' })
export class OfferImageService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/offer-image`;

  getByOfferId(offerId: number): Observable<OfferImage[]> {
    return this.http.get<OfferImage[]>(`${this.baseUrl}/offer/${offerId}`);
  }

  getByEventId(eventId: number): Observable<OfferImage[]> {
    return this.http.get<OfferImage[]>(`${this.baseUrl}/event/${eventId}`);
  }

  upload(offerId: number, files: File[]): Observable<OfferImage[]> {
    const form = new FormData();
    files.forEach((file) => form.append('images', file));
    return this.http.post<OfferImage[]>(`${this.baseUrl}/offer/${offerId}`, form);
  }

  fetchContent(imageId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${imageId}`, { responseType: 'blob' });
  }

  delete(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${imageId}`);
  }
}
