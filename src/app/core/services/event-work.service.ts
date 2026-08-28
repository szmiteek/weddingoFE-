import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EventWork, EventWorkCreateCommand } from '../models/event-work.model';

@Injectable({ providedIn: 'root' })
export class EventWorkService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/event-work`;

  create(command: EventWorkCreateCommand): Observable<EventWork> {
    return this.http.post<EventWork>(this.baseUrl, command);
  }

  getAllByEventId(eventId: number): Observable<EventWork[]> {
    return this.http.get<EventWork[]>(`${this.baseUrl}/event/${eventId}`);
  }

  getAllByEmployeeId(employeeId: number): Observable<EventWork[]> {
    return this.http.get<EventWork[]>(`${this.baseUrl}/employee/${employeeId}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
