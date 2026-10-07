import { Component, computed, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormRecord,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Observable, of, tap } from 'rxjs';
import { Offer, OfferPdfOverrides, OfferUpdateCommand } from '../../../../core/models/offer.model';
import { EventElement } from '../../../../core/models/event-element.model';
import {
  DECORATION_TYPE_OPTIONS,
  EVENT_TYPE_OPTIONS,
  FLOWERS_TYPE_OPTIONS,
  MAIN_TABLE_SEATS_OPTIONS,
  TABLE_TYPE_OPTIONS,
} from '../../../../core/models/offer-options';
import { EventElementService } from '../../../../core/services/event-element.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { OfferService } from '../../../../core/services/offer.service';
import { MultiselectDropdown } from '../../../../shared/components/multiselect-dropdown/multiselect-dropdown';
import { SingleselectDropdown } from '../../../../shared/components/singleselect-dropdown/singleselect-dropdown';
import { EventElementsTable } from '../event-elements-table/event-elements-table';

type FieldKind = 'text' | 'email' | 'date' | 'number' | 'textarea' | 'single' | 'multi' | 'boolean';

interface FieldDefinition {
  /** Offer property the field is read from and saved to. */
  property: keyof OfferUpdateCommand & keyof Offer;
  kind: FieldKind;
  options?: string[];
}

interface PdfFormField extends FieldDefinition {
  key: string;
  label: string;
}

/** How each field chosen in the offer settings is edited, keyed like the backend's OfferInfoField. */
const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  PERSONAL_DATA: { property: 'personalData', kind: 'text' },
  EMAIL: { property: 'email', kind: 'email' },
  PHONE: { property: 'phone', kind: 'text' },
  VENUE: { property: 'venue', kind: 'text' },
  EVENT_DATE: { property: 'eventDate', kind: 'date' },
  BUDGET: { property: 'budget', kind: 'number' },
  GUESTS: { property: 'guests', kind: 'number' },
  EVENT_TYPE: { property: 'eventType', kind: 'multi', options: EVENT_TYPE_OPTIONS },
  AFTER_WEDDING_PARTY: { property: 'afterWeddingParty', kind: 'boolean' },
  DECORATION_TYPE: { property: 'decorationType', kind: 'multi', options: DECORATION_TYPE_OPTIONS },
  MAIN_TABLE_TYPE: { property: 'mainTableType', kind: 'single', options: TABLE_TYPE_OPTIONS },
  MAIN_TABLE_SEATS: { property: 'mainTableSeats', kind: 'single', options: MAIN_TABLE_SEATS_OPTIONS },
  GUESTS_TABLE_TYPE: { property: 'guestsTableType', kind: 'single', options: TABLE_TYPE_OPTIONS },
  FLOWERS_TYPE: { property: 'flowersType', kind: 'single', options: FLOWERS_TYPE_OPTIONS },
  COLORS: { property: 'colors', kind: 'text' },
  DESCRIPTION: { property: 'description', kind: 'textarea' },
};

@Component({
  selector: 'app-pdf-prepare-modal',
  imports: [ReactiveFormsModule, EventElementsTable, SingleselectDropdown, MultiselectDropdown],
  templateUrl: './pdf-prepare-modal.html',
})
export class PdfPrepareModal {
  private fb = inject(FormBuilder);
  private eventElementService = inject(EventElementService);
  private offerService = inject(OfferService);
  private notifications = inject(NotificationService);

  offer = input.required<Offer>();
  /** Set by the parent while the PDF is being generated — the request outlives this modal's own saving state. */
  generating = input(false);

  close = output<void>();
  generate = output<OfferPdfOverrides>();

  protected step = signal<1 | 2>(1);
  protected elements = signal<EventElement[]>([]);
  /** Fields chosen in Ustawienia → Ustawienia oferty; null while loading. */
  protected fields = signal<PdfFormField[] | null>(null);
  protected saving = signal(false);
  /** The save that „Generuj PDF” does first — kept apart from `saving`, so only one button shows progress. */
  protected submitting = signal(false);
  /** A signed offer can't be edited any more — the modal then only generates the PDF. */
  protected readOnly = computed(() => this.offer().status === 'SIGNED');

  /** One control per field, keyed by the field's key — the set depends on the tenant's settings. */
  protected form = new FormRecord<AbstractControl>({});

  protected pricingForm = this.fb.nonNullable.group({
    description: [''],
  });

  ngOnInit(): void {
    const offer = this.offer();
    this.pricingForm.setValue({ description: offer.decorationDescription ?? '' });
    if (this.readOnly()) {
      this.pricingForm.disable();
    }

    this.offerService.getPdfFields(offer.id).subscribe((pdfFields) => {
      const fields = pdfFields.flatMap((field) => {
        const definition = FIELD_DEFINITIONS[field.key];
        return definition ? [{ ...definition, key: field.key, label: field.label }] : [];
      });
      for (const field of fields) {
        this.form.addControl(field.key, this.fb.control(this.initialValue(offer, field), this.validatorsFor(field)));
      }
      if (this.readOnly()) {
        this.form.disable();
      }
      // Values come from the offer, not from typing, so gaps have to show up the moment the modal opens.
      this.form.markAllAsTouched();
      this.fields.set(fields);
    });
    this.loadElements();
  }

  /** Every chosen field lands in the PDF, so an empty one would print a blank line in the offer. */
  private validatorsFor(field: PdfFormField): ValidatorFn[] {
    return field.kind === 'email' ? [Validators.required, Validators.email] : [Validators.required];
  }

  private initialValue(offer: Offer, field: PdfFormField): unknown {
    const value = offer[field.property];
    if (field.kind === 'multi') {
      return value ?? [];
    }
    if (field.kind === 'number') {
      return value ?? null;
    }
    if (field.kind === 'boolean') {
      return value ?? false;
    }
    return value ?? '';
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

  /** Any request in flight — the save behind „Zapisz”, the one behind „Generuj PDF”, or the generating itself. */
  protected busy = computed(() => this.saving() || this.submitting() || this.generating());

  /** True from the click on „Generuj PDF” until the PDF is back — the save before it counts as generating. */
  protected showGenerating = computed(() => this.submitting() || this.generating());

  protected showsError(field: PdfFormField): boolean {
    const control = this.form.get(field.key);
    return !!control && control.invalid && control.touched;
  }

  protected errorFor(field: PdfFormField): string {
    return this.form.get(field.key)?.hasError('email') ? 'Podaj poprawny adres e-mail.' : 'To pole jest wymagane.';
  }

  /** Step-1 fields that are still empty, or filled in wrong (a broken e-mail). */
  protected invalidFieldLabels(): string[] {
    return (this.fields() ?? []).filter((field) => this.form.get(field.key)?.invalid).map((field) => field.label);
  }

  /** What still stands between the offer and its PDF. A signed offer can't be edited, so nothing blocks it there. */
  protected pdfBlockers(): string[] {
    if (this.readOnly()) {
      return [];
    }
    const blockers = this.invalidFieldLabels();
    if (!this.pricingForm.getRawValue().description.trim()) {
      blockers.push('opis dekoracji');
    }
    if (this.elements().length === 0) {
      blockers.push('co najmniej jeden element wyceny');
    }
    return blockers;
  }

  protected canGenerate(): boolean {
    return !this.busy() && this.fields() !== null && this.pdfBlockers().length === 0;
  }

  canSave(): boolean {
    return !this.readOnly() && !this.busy() && this.form.valid && (this.form.dirty || this.pricingForm.dirty);
  }

  save(): void {
    if (!this.canSave()) {
      return;
    }
    this.saving.set(true);
    this.persist().subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.success('Zmiany w ofercie zostały zapisane.');
      },
      error: () => this.saving.set(false),
    });
  }

  /** Generating always saves first, so the offer and its PDF never disagree. */
  submit(): void {
    if (!this.canGenerate()) {
      return;
    }
    this.submitting.set(true);
    this.persist().subscribe({
      next: () => {
        this.submitting.set(false);
        // Fields come from the offer that was just saved; only the description is passed along explicitly.
        this.generate.emit({ fields: {}, decorationDescription: this.pricingForm.getRawValue().description });
      },
      error: () => this.submitting.set(false),
    });
  }

  /** Sends only what changed — untouched fields stay out, so e.g. an event date already in the past can't block saving. */
  private persist(): Observable<Offer | null> {
    if (this.readOnly()) {
      return of(null);
    }
    const command: Record<string, unknown> = {};
    for (const field of this.fields() ?? []) {
      const control = this.form.get(field.key);
      if (control?.dirty) {
        command[field.property] = this.toCommandValue(field, control.value);
      }
    }
    if (this.pricingForm.dirty) {
      command['decorationDescription'] = this.pricingForm.getRawValue().description;
    }
    if (Object.keys(command).length === 0) {
      return of(null);
    }
    return this.offerService.update(this.offer().id, command as OfferUpdateCommand).pipe(
      tap(() => {
        this.form.markAsPristine();
        this.pricingForm.markAsPristine();
      }),
    );
  }

  private toCommandValue(field: PdfFormField, value: unknown): unknown {
    // The backend skips missing values, so an emptied number or date leaves the stored one as it was.
    if (field.kind === 'number') {
      return value === '' || value == null ? undefined : Number(value);
    }
    if (field.kind === 'date') {
      return value || undefined;
    }
    return value;
  }
}
