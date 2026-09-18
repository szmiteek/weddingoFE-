import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OfferService } from '../../../core/services/offer.service';
import { EventService } from '../../../core/services/event.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { Offer, OfferFilter } from '../../../core/models/offer.model';
import { Paginator } from '../../../shared/components/paginator/paginator';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { SortLabel } from '../../../shared/components/sort-label/sort-label';
import { AppDatePipe } from '../../../shared/pipes/app-date.pipe';

@Component({
  selector: 'app-offers-list',
  imports: [Paginator, StatusBadge, DecimalPipe, ReactiveFormsModule, SortLabel, AppDatePipe],
  templateUrl: './offers-list.html',
  styleUrl: './offers-list.scss',
})
export class OffersList {
  private offerService = inject(OfferService);
  private eventService = inject(EventService);
  private notifications = inject(NotificationService);
  private confirm = inject(ConfirmService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  protected offers = signal<Offer[]>([]);
  protected loading = signal(true);
  protected currentPage = signal(0);
  protected totalPages = signal(0);
  protected totalElements = signal(0);
  protected sortField = signal('createdDate');
  protected sortDir = signal<'asc' | 'desc'>('desc');

  protected filterForm = this.fb.nonNullable.group({
    createdDateFrom: [''],
    createdDateTo: [''],
    eventDateFrom: [''],
    eventDateTo: [''],
    client: [''],
    venue: [''],
  });
  private activeFilter = signal<OfferFilter>({});

  ngOnInit(): void {
    this.load(0);
  }

  load(page: number): void {
    this.loading.set(true);
    const sort = `${this.sortField()},${this.sortDir()}`;
    this.offerService.getAll(page, 15, sort, this.activeFilter()).subscribe((result) => {
      this.offers.set(result.content);
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

  goToDetail(offer: Offer): void {
    this.router.navigate(['/offers', offer.id]);
  }

  async remove(offer: Offer, event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.ask({
      title: 'Usuń ofertę',
      message: `Czy na pewno chcesz usunąć ofertę dla „${offer.personalData}”?`,
      confirmLabel: 'Usuń',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.offerService.delete(offer.id).subscribe(() => {
      this.notifications.success('Oferta usunięta.');
      const isLastOnPage = this.offers().length === 1 && this.currentPage() > 0;
      this.load(isLastOnPage ? this.currentPage() - 1 : this.currentPage());
    });
  }

  async goToEvent(offer: Offer, event: Event): Promise<void> {
    event.stopPropagation();
    this.eventService.findByOfferId(offer.id).subscribe((linkedEvent) => {
      if (linkedEvent) {
        this.router.navigate(['/events', linkedEvent.id]);
      } else {
        this.notifications.info('Nie znaleziono powiązanego eventu.');
      }
    });
  }
}
