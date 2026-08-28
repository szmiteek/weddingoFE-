import { Component, WritableSignal, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicOfferService } from '../../core/services/public-offer.service';

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

  protected readonly eventTypeOptions = [
    'Dekoracja sali weselnej',
    'Dekoracja plenerowego miejsca zaślubin',
    'Bukiet Panny Młodej, Świadkowej, butonierki',
    'Dekoracja urodzin',
  ];

  protected readonly decorationTypeOptions = ['Kompozycje niskie', 'Kompozycje wysokie', 'Kompozycje mieszane'];
  protected readonly tableTypeOptions = ['Prostokątny', 'Okrągły'];
  protected readonly mainTableSeatsOptions = ['Sami', 'ze Świadkami'];
  protected readonly flowersTypeOptions = ['Naturalne', 'Sztuczne', 'Mieszane (naturalne i sztuczne)'];

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
  protected notFound = signal(false);
  protected loading = signal(true);
  protected submitting = signal(false);
  protected submitted = signal(false);

  protected selectedEventTypes = signal<string[]>([]);
  protected selectedDecorationTypes = signal<string[]>([]);
  protected selectedImages = signal<{ file: File; url: string }[]>([]);

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
      this.selectedImages().length > 0
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

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    const withUrls = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    this.selectedImages.update((list) => [...list, ...withUrls]);
    input.value = '';
  }

  removeImage(index: number): void {
    this.selectedImages.update((list) => {
      URL.revokeObjectURL(list[index].url);
      return list.filter((_, i) => i !== index);
    });
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
