import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EventElement, EventElementCreateCommand, EventElementUpdateCommand } from '../models/event-element.model';

@Injectable({ providedIn: 'root' })
export class EventElementService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/event-element`;

  getByOfferId(offerId: number): Observable<EventElement[]> {
    return this.http.get<EventElement[]>(`${this.baseUrl}/offer/${offerId}`);
  }

  getByEventId(eventId: number): Observable<EventElement[]> {
    return this.http.get<EventElement[]>(`${this.baseUrl}/event/${eventId}`);
  }

  create(command: EventElementCreateCommand): Observable<EventElement> {
    return this.http.post<EventElement>(this.baseUrl, command);
  }

  update(id: number, command: EventElementUpdateCommand): Observable<EventElement> {
    return this.http.put<EventElement>(`${this.baseUrl}/${id}`, command);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
