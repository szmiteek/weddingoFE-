import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EmployeeService } from '../../core/services/employee.service';
import { EventService } from '../../core/services/event.service';
import { OfferService } from '../../core/services/offer.service';
import { Offer } from '../../core/models/offer.model';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { AppDatePipe } from '../../shared/pipes/app-date.pipe';

interface DashboardStats {
  employees: number;
  offersTotal: number;
  offersPending: number;
  events: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, StatusBadge, AppDatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private employeeService = inject(EmployeeService);
  private offerService = inject(OfferService);
  private eventService = inject(EventService);

  protected loading = signal(true);
  protected stats = signal<DashboardStats>({ employees: 0, offersTotal: 0, offersPending: 0, events: 0 });
  protected recentOffers = signal<Offer[]>([]);

  ngOnInit(): void {
    forkJoin({
      employees: this.employeeService.getAll(0, 1),
      offers: this.offerService.getAll(0, 500),
      events: this.eventService.getAll(0, 1),
    }).subscribe(({ employees, offers, events }) => {
      const pending = offers.content.filter((o) => o.status !== 'SIGNED').length;
      this.stats.set({
        employees: employees.totalElements,
        offersTotal: offers.totalElements,
        offersPending: pending,
        events: events.totalElements,
      });
      this.recentOffers.set(offers.content.slice(0, 5));
      this.loading.set(false);
    });
  }
}
