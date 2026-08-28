import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Offer, OfferPdfOverrides } from '../../../../core/models/offer.model';
import { EventElement } from '../../../../core/models/event-element.model';
import { EventElementService } from '../../../../core/services/event-element.service';
import { EventElementsTable } from '../event-elements-table/event-elements-table';

@Component({
  selector: 'app-pdf-prepare-modal',
  imports: [ReactiveFormsModule, EventElementsTable],
  templateUrl: './pdf-prepare-modal.html',
})
export class PdfPrepareModal {
  private fb = inject(FormBuilder);
  private eventElementService = inject(EventElementService);

  offer = input.required<Offer>();

  close = output<void>();
  generate = output<OfferPdfOverrides>();

  protected step = signal<1 | 2>(1);
  protected elements = signal<EventElement[]>([]);

  protected form = this.fb.nonNullable.group({
    date: [''],
    venue: [''],
    guests: this.fb.control<number | null>(null),
    colors: [''],
    mainTable: [''],
    guestsTable: [''],
    flowers: [''],
  });

  protected pricingForm = this.fb.nonNullable.group({
    description: [''],
  });

  ngOnInit(): void {
    const offer = this.offer();
    const mainTable = offer.mainTableType ?? '';
    this.form.setValue({
      date: offer.eventDate ?? '',
      venue: offer.venue ?? '',
      guests: offer.guests ?? null,
      colors: offer.colors ?? '',
      mainTable,
      guestsTable: offer.guestsTableType ?? '',
      flowers: '',
    });
    this.pricingForm.setValue({ description: offer.decorationDescription ?? '' });
    this.loadElements();
  }

  private loadElements(): void {
    this.eventElementService.getByOfferId(this.offer().id).subscribe((elements) => this.elements.set(elements));
  }

  protected onElementsChanged(elements: EventElement[]): void {
    this.elements.set(elements);
  }

  nextStep(): void {
    this.step.set(2);
  }

  previousStep(): void {
    this.step.set(1);
  }

  submit(): void {
    this.generate.emit({
      ...this.form.getRawValue(),
      description: this.pricingForm.getRawValue().description,
    });
  }
}
