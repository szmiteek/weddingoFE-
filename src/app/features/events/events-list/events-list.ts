import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { EventFilter, EventItem } from '../../../core/models/event.model';
import { Paginator } from '../../../shared/components/paginator/paginator';
import { SortLabel } from '../../../shared/components/sort-label/sort-label';
import { AppDatePipe } from '../../../shared/pipes/app-date.pipe';

@Component({
  selector: 'app-events-list',
  imports: [Paginator, DecimalPipe, SortLabel, ReactiveFormsModule, AppDatePipe],
  templateUrl: './events-list.html',
  styleUrl: './events-list.scss',
})
export class EventsList {
  private eventService = inject(EventService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);
  private confirm = inject(ConfirmService);

  protected events = signal<EventItem[]>([]);
  protected loading = signal(true);
  protected currentPage = signal(0);
  protected totalPages = signal(0);
  protected totalElements = signal(0);
  protected sortField = signal('id');
  protected sortDir = signal<'asc' | 'desc'>('desc');

  protected filterForm = this.fb.nonNullable.group({
    dateFrom: [''],
    dateTo: [''],
    client: [''],
    venue: [''],
  });
  private activeFilter = signal<EventFilter>({});

  ngOnInit(): void {
    this.load(0);
  }

  load(page: number): void {
    this.loading.set(true);
    const sort = `${this.sortField()},${this.sortDir()}`;
    this.eventService.getAll(page, 15, sort, this.activeFilter()).subscribe((result) => {
      this.events.set(result.content);
      this.currentPage.set(result.number);
      this.totalPages.set(result.totalPages);
      this.totalElements.set(result.totalElements);
      this.loading.set(false);
    });
  }

  applyFilters(): void {
    this.activeFilter.set(this.filterForm.getRawValue());
    this.load(0);
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.activeFilter.set({});
    this.load(0);
  }

  sortBy(field: string): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.load(0);
  }

  goToDetail(event: EventItem): void {
    this.router.navigate(['/events', event.id]);
  }

  async remove(item: EventItem, clickEvent: Event): Promise<void> {
    clickEvent.stopPropagation();
    const confirmed = await this.confirm.ask({
      title: 'Usuń event',
      message: item.offerId
        ? `Event „${item.clientPersonalData}” zostanie usunięty razem z wpisami godzin pracy oraz powiązaną ofertą #${item.offerId}. Tej operacji nie można cofnąć.`
        : `Event „${item.clientPersonalData}” zostanie usunięty razem z wpisami godzin pracy. Tej operacji nie można cofnąć.`,
      confirmLabel: 'Usuń',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.eventService.delete(item.id).subscribe(() => {
      this.notifications.success('Event usunięty.');
      const isLastOnPage = this.events().length === 1 && this.currentPage() > 0;
      this.load(isLastOnPage ? this.currentPage() - 1 : this.currentPage());
    });
  }
}
