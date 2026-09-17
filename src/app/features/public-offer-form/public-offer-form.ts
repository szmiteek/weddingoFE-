import { Component, WritableSignal, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicOfferService } from '../../core/services/public-offer.service';
import {
  DECORATION_TYPE_OPTIONS,
  EVENT_TYPE_OPTIONS,
  FLOWERS_TYPE_OPTIONS,
  MAIN_TABLE_SEATS_OPTIONS,
  TABLE_TYPE_OPTIONS,
} from '../../core/models/offer-options';

interface SingleSelectField {
  selected: WritableSignal<string | null>;
  custom: WritableSignal<string>;
}

interface SingleSelectConfig {
  key: string;
  label: string;
  options: string[];
  field: SingleSelectField;
}

/** Same limit the backend enforces — an offer holds at most this many pictures. */
const MAX_IMAGES = 5;

@Component({
  selector: 'app-public-offer-form',
  imports: [ReactiveFormsModule],
  templateUrl: './public-offer-form.html',
  styleUrl: './public-offer-form.scss',
})
export class PublicOfferForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private publicOfferService = inject(PublicOfferService);

  protected readonly OTHER = '__other__';
  protected readonly maxImages = MAX_IMAGES;

  protected readonly eventTypeOptions = EVENT_TYPE_OPTIONS;
  protected readonly decorationTypeOptions = DECORATION_TYPE_OPTIONS;
  protected readonly tableTypeOptions = TABLE_TYPE_OPTIONS;
  protected readonly mainTableSeatsOptions = MAIN_TABLE_SEATS_OPTIONS;
  protected readonly flowersTypeOptions = FLOWERS_TYPE_OPTIONS;

  private mainTableTypeField = this.createField();
  private mainTableSeatsField = this.createField();
  private guestsTableTypeField = this.createField();
  private flowersTypeField = this.createField();

  protected singleSelectFields: SingleSelectConfig[] = [
    { key: 'mainTableType', label: 'Typ stołu prezydialnego', options: this.tableTypeOptions, field: this.mainTableTypeField },
    {
      key: 'mainTableSeats',
      label: 'Przy stole prezydialnym będziemy siedzieć',
      options: this.mainTableSeatsOptions,
      field: this.mainTableSeatsField,
    },
    { key: 'guestsTableType', label: 'Typ stołów gości', options: this.tableTypeOptions, field: this.guestsTableTypeField },
    { key: 'flowersType', label: 'Rodzaj kwiatów', options: this.flowersTypeOptions, field: this.flowersTypeField },
  ];

  private token = this.route.snapshot.paramMap.get('token') ?? '';

  protected companyName = signal<string | null>(null);
  /** The tenant's logo from their offer settings; null when they haven't uploaded one. */
  protected logoUrl = signal<string | null>(null);
  protected notFound = signal(false);
  protected loading = signal(true);
  protected submitting = signal(false);
  protected submitted = signal(false);

  protected selectedEventTypes = signal<string[]>([]);
  protected selectedDecorationTypes = signal<string[]>([]);
  /** Yes/no question — null until answered, so an unanswered form can't quietly submit "no". */
  protected appetizersOnTable = signal<boolean | null>(null);
  protected selectedImages = signal<{ file: File; url: string }[]>([]);
  /** Set when a pick had to be trimmed to the limit, so the client learns why not everything was added. */
  protected imageLimitHit = signal(false);

  protected submitAttempted = signal(false);

  protected form = this.fb.nonNullable.group({
    personalData: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    venue: ['', Validators.required],
    eventDate: ['', Validators.required],
    budget: this.fb.control<number | null>(null, Validators.required),
    guests: this.fb.control<number | null>(null, Validators.required),
    colors: ['', Validators.required],
    description: ['', Validators.required],
    honeypot: [''],
  });

  ngOnInit(): void {
    this.publicOfferService.getTenantInfo(this.token).subscribe({
      next: (info) => {
        this.companyName.set(info.companyName);
        this.logoUrl.set(info.hasLogo ? this.publicOfferService.logoUrl(this.token) : null);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  private createField(): SingleSelectField {
    return { selected: signal<string | null>(null), custom: signal('') };
  }

  selectOption(field: SingleSelectField, value: string): void {
    field.selected.set(value);
  }

  setCustom(field: SingleSelectField, value: string): void {
    field.custom.set(value);
  }

  private finalValue(field: SingleSelectField): string {
    return field.selected() === this.OTHER ? field.custom().trim() : (field.selected() ?? '');
  }

  isSingleSelectMissing(item: SingleSelectConfig): boolean {
    return this.submitAttempted() && this.finalValue(item.field).length === 0;
  }

  private allSingleSelectsFilled(): boolean {
    return this.singleSelectFields.every((item) => this.finalValue(item.field).length > 0);
  }

  canSubmit(): boolean {
    return (
      this.form.valid &&
      this.selectedEventTypes().length > 0 &&
      this.selectedDecorationTypes().length > 0 &&
      this.allSingleSelectsFilled() &&
      this.appetizersOnTable() !== null &&
      this.selectedImages().length > 0 &&
      this.selectedImages().length <= MAX_IMAGES
    );
  }

  toggleEventType(value: string): void {
    this.selectedEventTypes.update((list) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]));
  }

  toggleDecorationType(value: string): void {
    this.selectedDecorationTypes.update((list) =>
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  }

  imagesLeft(): number {
    return Math.max(0, MAX_IMAGES - this.selectedImages().length);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    // Take what still fits and say so, rather than dropping the whole pick.
    const accepted = files.slice(0, this.imagesLeft());
    this.imageLimitHit.set(accepted.length < files.length);
    if (accepted.length === 0) {
      return;
    }
    const withUrls = accepted.map((file) => ({ file, url: URL.createObjectURL(file) }));
    this.selectedImages.update((list) => [...list, ...withUrls]);
  }

  removeImage(index: number): void {
    this.selectedImages.update((list) => {
      URL.revokeObjectURL(list[index].url);
      return list.filter((_, i) => i !== index);
    });
    this.imageLimitHit.set(false);
  }

  submit(): void {
    if (!this.canSubmit()) {
      this.submitAttempted.set(true);
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const value = this.form.getRawValue();
    this.publicOfferService
      .submit(
        this.token,
        {
          personalData: value.personalData,
          email: value.email,
          phone: value.phone,
          venue: value.venue,
          eventDate: value.eventDate || null,
          budget: value.budget,
          guests: value.guests,
          eventType: this.selectedEventTypes(),
          decorationType: this.selectedDecorationTypes(),
          colors: value.colors,
          description: value.description,
          mainTableType: this.finalValue(this.mainTableTypeField),
          mainTableSeats: this.finalValue(this.mainTableSeatsField),
          guestsTableType: this.finalValue(this.guestsTableTypeField),
          flowersType: this.finalValue(this.flowersTypeField),
          appetizersOnTable: this.appetizersOnTable(),
          honeypot: value.honeypot,
        },
        this.selectedImages().map((image) => image.file),
      )
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
        },
        error: () => this.submitting.set(false),
      });
  }
}
