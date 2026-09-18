import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EventService } from '../../../core/services/event.service';
import { EventWorkService } from '../../../core/services/event-work.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { OfferImageService } from '../../../core/services/offer-image.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { EventItem } from '../../../core/models/event.model';
import { EventWork, EventWorkCreateCommand } from '../../../core/models/event-work.model';
import { Employee } from '../../../core/models/employee.model';
import { OfferImage } from '../../../core/models/offer-image.model';
import { EventWorkModal } from './event-work-modal/event-work-modal';
import { ImageGallery } from '../../../shared/components/image-gallery/image-gallery';
import { EventElementsTable } from '../../offers/offer-detail/event-elements-table/event-elements-table';
import { EventElementService } from '../../../core/services/event-element.service';
import { EventElement } from '../../../core/models/event-element.model';
import { AppDatePipe } from '../../../shared/pipes/app-date.pipe';

@Component({
  selector: 'app-event-detail',
  imports: [RouterLink, DecimalPipe, ReactiveFormsModule, EventWorkModal, ImageGallery, EventElementsTable, AppDatePipe],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss',
})
export class EventDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private eventWorkService = inject(EventWorkService);
  private employeeService = inject(EmployeeService);
  private offerImageService = inject(OfferImageService);
  private eventElementService = inject(EventElementService);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);
  private confirm = inject(ConfirmService);

  protected event = signal<EventItem | null>(null);
  protected works = signal<EventWork[]>([]);
  protected employees = signal<Employee[]>([]);
  protected images = signal<OfferImage[]>([]);
  protected loading = signal(true);
  protected modalOpen = signal(false);
  protected saving = signal(false);
  protected deleting = signal(false);
  protected eventElements = signal<EventElement[]>([]);
  protected pricingEditMode = signal(false);
  protected savingPricing = signal(false);

  protected pricingForm = this.fb.nonNullable.group({
    price: this.fb.control<number | null>(null),
    comment: [''],
  });

  protected readonly employeeMap = computed(() => {
    const map = new Map<number, Employee>();
    this.employees().forEach((e) => map.set(e.id, e));
    return map;
  });

  protected readonly totalHours = computed(() => this.works().reduce((sum, w) => sum + w.hoursWorked, 0));

  protected readonly totalLaborCost = computed(() =>
    this.works().reduce((sum, w) => {
      const employee = this.employeeMap().get(w.employeeId);
      return sum + w.hoursWorked * (employee?.hourlyRate ?? 0);
    }, 0),
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  private load(id: number): void {
    this.loading.set(true);
    forkJoin({
      event: this.eventService.getById(id),
      works: this.eventWorkService.getAllByEventId(id),
      employees: this.employeeService.getAll(0, 1000),
    }).subscribe(({ event, works, employees }) => {
      this.event.set(event);
      this.works.set(works);
      this.employees.set(employees.content);
      this.pricingForm.setValue({ price: event.price, comment: event.comment ?? '' });
      this.pricingForm.disable();
      this.pricingEditMode.set(false);
      this.loading.set(false);
    });
    this.offerImageService.getByEventId(id).subscribe((images) => this.images.set(images));
    this.eventElementService.getByEventId(id).subscribe((elements) => this.eventElements.set(elements));
  }

  employeeName(employeeId: number): string {
    const employee = this.employeeMap().get(employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : `#${employeeId}`;
  }

  openAddWork(): void {
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  submitWork(command: Omit<EventWorkCreateCommand, 'eventId'>): void {
    const event = this.event();
    if (!event) {
      return;
    }
    this.saving.set(true);
    this.eventWorkService.create({ ...command, eventId: event.id }).subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.notifications.success('Godziny pracy dodane.');
        this.load(event.id);
      },
      error: () => this.saving.set(false),
    });
  }

  async removeWork(work: EventWork): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Usuń wpis',
      message: `Usunąć wpis godzin pracy dla ${this.employeeName(work.employeeId)}?`,
      confirmLabel: 'Usuń',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.eventWorkService.delete(work.id).subscribe(() => {
      this.notifications.success('Wpis usunięty.');
      const event = this.event();
      if (event) {
        this.load(event.id);
      }
    });
  }

  /** Elements were saved on this page — apply the fresh list and the recalculated price. */
  onElementsChanged(elements: EventElement[]): void {
    this.eventElements.set(elements);
    const price = elements.reduce((sum, element) => sum + element.quantity * element.unitPrice, 0);
    this.event.update((event) => (event ? { ...event, price } : event));
    this.pricingForm.patchValue({ price });
  }

  startPricingEdit(): void {
    this.pricingForm.enable();
    this.pricingEditMode.set(true);
  }

  cancelPricingEdit(): void {
    const event = this.event();
    if (event) {
      this.pricingForm.patchValue({ price: event.price, comment: event.comment ?? '' });
    }
    this.pricingForm.markAsPristine();
    this.pricingForm.disable();
    this.pricingEditMode.set(false);
  }

  savePricing(): void {
    const event = this.event();
    if (!event) {
      return;
    }
    const value = this.pricingForm.getRawValue();
    this.savingPricing.set(true);
    this.eventService
      .update(event.id, { price: value.price ?? undefined, comment: value.comment })
      .subscribe({
        next: (updated) => {
          this.event.set(updated);
          this.pricingForm.markAsPristine();
          this.pricingForm.disable();
          this.pricingEditMode.set(false);
          this.savingPricing.set(false);
          this.notifications.success('Zapisano zmiany.');
        },
        error: () => this.savingPricing.set(false),
      });
  }

  async removeEvent(): Promise<void> {
    const event = this.event();
    if (!event) {
      return;
    }
    const confirmed = await this.confirm.ask({
      title: 'Usuń event',
      message: event.offerId
        ? `Event zostanie usunięty razem z wpisami godzin pracy oraz powiązaną ofertą #${event.offerId}. Tej operacji nie można cofnąć.`
        : 'Event zostanie usunięty razem z wpisami godzin pracy. Tej operacji nie można cofnąć.',
      confirmLabel: 'Usuń',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.deleting.set(true);
    this.eventService.delete(event.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.notifications.success('Event usunięty.');
        this.router.navigate(['/events']);
      },
      error: () => this.deleting.set(false),
    });
  }
}
