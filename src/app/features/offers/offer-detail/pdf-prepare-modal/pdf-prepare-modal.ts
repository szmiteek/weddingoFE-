import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Offer, OfferPdfField, OfferPdfOverrides } from '../../../../core/models/offer.model';
import { EventElement } from '../../../../core/models/event-element.model';
import { EventElementService } from '../../../../core/services/event-element.service';
import { OfferService } from '../../../../core/services/offer.service';
import { EventElementsTable } from '../event-elements-table/event-elements-table';

@Component({
  selector: 'app-pdf-prepare-modal',
  imports: [ReactiveFormsModule, EventElementsTable],
  templateUrl: './pdf-prepare-modal.html',
})
export class PdfPrepareModal {
  private fb = inject(FormBuilder);
  private eventElementService = inject(EventElementService);
  private offerService = inject(OfferService);

  offer = input.required<Offer>();

  close = output<void>();
  generate = output<OfferPdfOverrides>();

  protected step = signal<1 | 2>(1);
  protected elements = signal<EventElement[]>([]);
  /** Fields chosen in Ustawienia → Ustawienia oferty, pre-filled from this offer; null while loading. */
  protected fields = signal<OfferPdfField[] | null>(null);

  /** One control per field, keyed by the field's key — the set depends on the tenant's settings. */
  protected form = this.fb.nonNullable.record<string>({});

  protected pricingForm = this.fb.nonNullable.group({
    description: [''],
  });

  ngOnInit(): void {
    const offer = this.offer();
    this.pricingForm.setValue({ description: offer.decorationDescription ?? '' });
    this.offerService.getPdfFields(offer.id).subscribe((fields) => {
      for (const field of fields) {
        this.form.addControl(field.key, this.fb.nonNullable.control(field.value));
      }
      this.fields.set(fields);
    });
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
      fields: this.form.getRawValue(),
      decorationDescription: this.pricingForm.getRawValue().description,
    });
  }
}
