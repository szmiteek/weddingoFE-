import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PublicOfferCommand, PublicTenantInfo } from '../models/public-offer.model';

@Injectable({ providedIn: 'root' })
export class PublicOfferService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/public/offers`;

  getTenantInfo(token: string): Observable<PublicTenantInfo> {
    return this.http.get<PublicTenantInfo>(`${this.baseUrl}/${token}`);
  }

  /** Public endpoint, so the logo can be used directly as an <img> source — no auth header needed. */
  logoUrl(token: string): string {
    return `${this.baseUrl}/${token}/logo`;
  }

  submit(token: string, command: PublicOfferCommand, images: File[]): Observable<void> {
    const formData = new FormData();
    formData.append('personalData', command.personalData);
    formData.append('email', command.email);
    formData.append('phone', command.phone);
    formData.append('venue', command.venue);
    if (command.eventDate) formData.append('eventDate', command.eventDate);
    if (command.budget != null) formData.append('budget', String(command.budget));
    if (command.guests != null) formData.append('guests', String(command.guests));
    command.eventType.forEach((value) => formData.append('eventType', value));
    command.decorationType.forEach((value) => formData.append('decorationType', value));
    formData.append('colors', command.colors);
    formData.append('description', command.description);
    formData.append('mainTableType', command.mainTableType);
    formData.append('mainTableSeats', command.mainTableSeats);
    formData.append('guestsTableType', command.guestsTableType);
    formData.append('flowersType', command.flowersType);
    if (command.appetizersOnTable != null) formData.append('appetizersOnTable', String(command.appetizersOnTable));
    formData.append('honeypot', command.honeypot);
    images.forEach((file) => formData.append('images', file));

    return this.http.post<void>(`${this.baseUrl}/${token}`, formData);
  }
}
