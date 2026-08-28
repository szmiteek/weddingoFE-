import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EventFilter, EventItem, EventUpdateCommand } from '../models/event.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/event`;

  getAll(page: number, size = 15, sort = 'id,desc', filter?: EventFilter): Observable<Page<EventItem>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        if (value) {
          params = params.set(key, value);
        }
      }
    }
    return this.http.get<Page<EventItem>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<EventItem> {
    return this.http.get<EventItem>(`${this.baseUrl}/${id}`);
  }

  update(id: number, command: EventUpdateCommand): Observable<EventItem> {
    return this.http.put<EventItem>(`${this.baseUrl}/${id}`, command);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  findByOfferId(offerId: number): Observable<EventItem | undefined> {
    const params = new HttpParams().set('page', 0).set('size', 500).set('sort', 'id,desc');
    return this.http
      .get<Page<EventItem>>(this.baseUrl, { params })
      .pipe(map((page) => page.content.find((e) => e.offerId === offerId)));
  }
}
