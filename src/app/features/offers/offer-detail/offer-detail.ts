import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OfferService } from '../../../core/services/offer.service';
import { EventService } from '../../../core/services/event.service';
import { OfferImageService } from '../../../core/services/offer-image.service';
import { EventElementService } from '../../../core/services/event-element.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { Offer, OfferPdfOverrides } from '../../../core/models/offer.model';
import { OfferImage } from '../../../core/models/offer-image.model';
import { EventElement } from '../../../core/models/event-element.model';
import { EventItem } from '../../../core/models/event.model';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { ImageGallery } from '../../../shared/components/image-gallery/image-gallery';
import { MultiselectDisplay } from '../../../shared/components/multiselect-display/multiselect-display';
import { SingleselectDisplay } from '../../../shared/components/singleselect-display/singleselect-display';
import { PdfPrepareModal } from './pdf-prepare-modal/pdf-prepare-modal';
import { PdfPreviewModal } from '../../../shared/components/pdf-preview-modal/pdf-preview-modal';
import { SendOfferModal } from './send-offer-modal/send-offer-modal';
import { EventElementsTable } from './event-elements-table/event-elements-table';
import {
  DECORATION_TYPE_OPTIONS,
  EVENT_TYPE_OPTIONS,
  FLOWERS_TYPE_OPTIONS,
  MAIN_TABLE_SEATS_OPTIONS,
  TABLE_TYPE_OPTIONS,
} from '../../../core/models/offer-options';
import { AppDatePipe } from '../../../shared/pipes/app-date.pipe';

/** Same limit the backend enforces — an offer holds at most this many pictures. */
const MAX_IMAGES = 5;

@Component({
  selector: 'app-offer-detail',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    StatusBadge,
    ImageGallery,
    MultiselectDisplay,
    SingleselectDisplay,
    DecimalPipe,
    PdfPrepareModal,
    PdfPreviewModal,
    SendOfferModal,
    EventElementsTable,
    AppDatePipe,
  ],
  templateUrl: './offer-detail.html',
  styleUrl: './offer-detail.scss',
})
export class OfferDetail {
  protected readonly eventTypeOptions = EVENT_TYPE_OPTIONS;

  protected readonly decorationTypeOptions = DECORATION_TYPE_OPTIONS;

  protected readonly tableTypeOptions = TABLE_TYPE_OPTIONS;

  protected readonly mainTableSeatsOptions = MAIN_TABLE_SEATS_OPTIONS;

  protected readonly flowersTypeOptions = FLOWERS_TYPE_OPTIONS;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private offerService = inject(OfferService);
  private eventService = inject(EventService);
  private offerImageService = inject(OfferImageService);
  private eventElementService = inject(EventElementService);
  private notifications = inject(NotificationService);
  private confirm = inject(ConfirmService);

  protected offer = signal<Offer | null>(null);
  /** Other events already booked for this offer's date — the event made from this offer doesn't count. */
  protected sameDateEvents = signal<EventItem[]>([]);
  protected images = signal<OfferImage[]>([]);
  protected eventElements = signal<EventElement[]>([]);
  protected loading = signal(true);
  protected saving = signal(false);
  protected linkedEventId = signal<number | null>(null);
  protected pdfModalOpen = signal(false);
  /** The PDF shown in the preview window — freshly generated or the one saved with the offer. */
  protected pdfPreview = signal<Blob | null>(null);
  protected loadingPdfPreview = signal(false);
  /** Generating outlives the modal's own saving state, so the modal gets it as an input. */
  protected generatingPdf = signal(false);
  protected priceEditMode = signal(false);
  protected decorationEditMode = signal(false);
  protected savingDecoration = signal(false);
  protected actionsMenuOpen = signal(false);
  protected sendingEmail = signal(false);
  protected sendModalOpen = signal(false);
  protected uploadingImages = signal(false);

  protected form = this.fb.nonNullable.group({
    price: this.fb.control<number | null>(null),
    comment: [''],
  });

  protected decorationForm = this.fb.nonNullable.group({
    decorationDescription: [''],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  private load(id: number): void {
    this.loading.set(true);
    this.offerService.getById(id).subscribe((offer) => {
      this.offer.set(offer);
      this.form.setValue({
        price: offer.price,
        comment: offer.comment ?? '',
      });
      this.form.disable();
      this.priceEditMode.set(false);
      this.decorationForm.setValue({ decorationDescription: offer.decorationDescription ?? '' });
      this.decorationForm.disable();
      this.decorationEditMode.set(false);
      if (offer.status === 'SIGNED') {
        this.eventService.findByOfferId(offer.id).subscribe((event) => {
          this.linkedEventId.set(event?.id ?? null);
        });
      }
      this.loadSameDateEvents(offer);
      this.loading.set(false);
    });
    this.offerImageService.getByOfferId(id).subscribe((images) => this.images.set(images));
    this.eventElementService.getByOfferId(id).subscribe((elements) => this.eventElements.set(elements));
  }

  /** Date clash check: other events already booked for this offer's date. */
  private loadSameDateEvents(offer: Offer): void {
    if (!offer.eventDate) {
      this.sameDateEvents.set([]);
      return;
    }
    this.eventService
      .getAll(0, 50, 'date,asc', { dateFrom: offer.eventDate, dateTo: offer.eventDate })
      .subscribe((page) => {
        // The event created from this very offer is not a clash with itself.
        this.sameDateEvents.set(page.content.filter((event) => event.offerId !== offer.id));
      });
  }

  /** Filter passed in the address, so the events list opens already narrowed to this date. */
  sameDateEventsFilter(): Record<string, string> {
    const date = this.offer()?.eventDate ?? '';
    return { dateFrom: date, dateTo: date };
  }

  sameDateEventsLabel(): string {
    const count = this.sameDateEvents().length;
    if (count === 1) {
      return 'W tym dniu jest już zaplanowany 1 event.';
    }
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
      return `W tym dniu są już zaplanowane ${count} eventy.`;
    }
    return `W tym dniu jest już zaplanowanych ${count} eventów.`;
  }

  toggleActionsMenu(): void {
    this.actionsMenuOpen.update((open) => !open);
  }

  closeActionsMenu(): void {
    this.actionsMenuOpen.set(false);
  }

  openPdfModal(): void {
    this.closeActionsMenu();
    this.pdfModalOpen.set(true);
  }

  /** Opens the PDF saved with the offer in the preview window. */
  openPdfPreview(): void {
    this.closeActionsMenu();
    const offer = this.offer();
    if (!offer) {
      return;
    }
    this.loadingPdfPreview.set(true);
    this.offerService.downloadSavedPdf(offer.id).subscribe({
      next: (blob) => {
        this.loadingPdfPreview.set(false);
        this.pdfPreview.set(blob);
      },
      error: () => this.loadingPdfPreview.set(false),
    });
  }

  closePdfPreview(): void {
    this.pdfPreview.set(null);
  }

  downloadPdfPreview(): void {
    const offer = this.offer();
    const pdf = this.pdfPreview();
    if (offer && pdf) {
      this.saveBlobAsFile(pdf, `oferta-${offer.id}.pdf`);
    }
  }

  openPdfPreviewInNewTab(): void {
    const pdf = this.pdfPreview();
    if (pdf) {
      this.openBlobInNewTab(pdf);
    }
  }

  downloadSavedPdf(): void {
    this.closeActionsMenu();
    const offer = this.offer();
    if (!offer) {
      return;
    }
    this.offerService
      .downloadSavedPdf(offer.id)
      .subscribe((blob) => this.saveBlobAsFile(blob, `oferta-${offer.id}.pdf`));
  }

  closePdfModal(): void {
    this.pdfModalOpen.set(false);
    this.syncAfterPdfModal();
  }

  generatePdf(overrides: OfferPdfOverrides): void {
    const offer = this.offer();
    if (!offer || this.generatingPdf()) {
      return;
    }
    this.generatingPdf.set(true);
    this.offerService.generatePdf(offer.id, overrides).subscribe({
      next: (blob) => {
        this.generatingPdf.set(false);
        this.closePdfModal();
        // Straight into the preview — no extra request, and the file is right there to check.
        this.pdfPreview.set(blob);
      },
      // The modal stays open on failure, so the wycena isn't lost and generating can be retried.
      error: () => this.generatingPdf.set(false),
    });
  }

  private openBlobInNewTab(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  private saveBlobAsFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  imagesLeft(): number {
    return Math.max(0, MAX_IMAGES - this.images().length);
  }

  uploadImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = ''; // let the same file be picked again after an error
    const offer = this.offer();
    if (!offer || files.length === 0) {
      return;
    }
    // The limit counts the whole offer, not one upload — the backend checks the same thing.
    if (files.length > this.imagesLeft()) {
      this.notifications.error(
        this.imagesLeft() === 0
          ? `Oferta ma już maksymalną liczbę zdjęć (${MAX_IMAGES}).`
          : `Do tej oferty możesz dodać jeszcze ${this.imagesLeft()} zdj. (maksymalnie ${MAX_IMAGES}).`,
      );
      return;
    }
    this.uploadingImages.set(true);
    this.offerImageService.upload(offer.id, files).subscribe({
      next: (saved) => {
        this.uploadingImages.set(false);
        this.images.update((list) => [...list, ...saved]);
        this.notifications.success(saved.length === 1 ? 'Zdjęcie dodane.' : `Dodano ${saved.length} zdjęcia.`);
      },
      error: () => this.uploadingImages.set(false),
    });
  }

  async removeImage(image: OfferImage): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Usuń zdjęcie',
      message: `Czy na pewno chcesz usunąć zdjęcie „${image.filename}”?`,
      confirmLabel: 'Usuń',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.offerImageService.delete(image.id).subscribe(() => {
      this.images.update((list) => list.filter((i) => i.id !== image.id));
      this.notifications.success('Zdjęcie usunięte.');
    });
  }

  /** Elements were saved/deleted directly on this page — apply the fresh list without an extra round trip. */
  onElementsChanged(elements: EventElement[]): void {
    this.eventElements.set(elements);
    const price = elements.reduce((sum, element) => sum + element.quantity * element.unitPrice, 0);
    this.offer.update((offer) => (offer ? { ...offer, price } : offer));
    this.form.patchValue({ price });
  }

  /** The PDF modal edits elements and the decoration description — resync from the server once it closes. */
  private syncAfterPdfModal(): void {
    const offer = this.offer();
    if (!offer) {
      return;
    }
    this.offerService.getById(offer.id).subscribe((updated) => {
      this.offer.set(updated);
      this.form.patchValue({ price: updated.price });
      this.decorationForm.patchValue({ decorationDescription: updated.decorationDescription ?? '' });
      this.decorationForm.markAsPristine();
    });
    this.eventElementService.getByOfferId(offer.id).subscribe((elements) => this.eventElements.set(elements));
  }

  startDecorationEdit(): void {
    this.decorationForm.enable();
    this.decorationEditMode.set(true);
  }

  cancelDecorationEdit(): void {
    const offer = this.offer();
    if (offer) {
      this.decorationForm.patchValue({ decorationDescription: offer.decorationDescription ?? '' });
    }
    this.decorationForm.markAsPristine();
    this.decorationForm.disable();
    this.decorationEditMode.set(false);
  }

  saveDecoration(): void {
    const offer = this.offer();
    if (!offer) {
      return;
    }
    this.savingDecoration.set(true);
    this.offerService
      .update(offer.id, { decorationDescription: this.decorationForm.getRawValue().decorationDescription })
      .subscribe({
        next: (updated) => {
          this.offer.set(updated);
          this.decorationForm.markAsPristine();
          this.decorationForm.disable();
          this.decorationEditMode.set(false);
          this.savingDecoration.set(false);
          this.notifications.success('Opis dekoracji zapisany.');
        },
        error: () => this.savingDecoration.set(false),
      });
  }

  startPriceEdit(): void {
    this.form.enable();
    this.priceEditMode.set(true);
  }

  cancelPriceEdit(): void {
    const offer = this.offer();
    if (offer) {
      this.form.patchValue({ price: offer.price, comment: offer.comment ?? '' });
    }
    this.form.markAsPristine();
    this.form.disable();
    this.priceEditMode.set(false);
  }

  save(): void {
    const offer = this.offer();
    if (!offer) {
      return;
    }
    this.saving.set(true);
    const value = this.form.getRawValue();
    this.offerService
      .update(offer.id, {
        comment: value.comment,
        price: value.price ?? undefined,
      })
      .subscribe({
        next: (updated) => {
          this.offer.set(updated);
          this.form.markAsPristine();
          this.form.disable();
          this.priceEditMode.set(false);
          this.saving.set(false);
          this.notifications.success('Oferta zaktualizowana.');
        },
        error: () => this.saving.set(false),
      });
  }

  openSendModal(): void {
    this.closeActionsMenu();
    this.sendModalOpen.set(true);
  }

  closeSendModal(): void {
    this.sendModalOpen.set(false);
  }

  sendEmail(email: string): void {
    const offer = this.offer();
    if (!offer) {
      return;
    }
    const resend = offer.status === 'SENT';
    this.sendingEmail.set(true);
    this.offerService.sendEmail(offer.id, email).subscribe({
      next: (updated) => {
        this.sendingEmail.set(false);
        this.sendModalOpen.set(false);
        this.offer.set(updated);
        this.notifications.success(
          `Oferta została wysłana ${resend ? 'ponownie ' : ''}na adres ${updated.email}.`,
        );
      },
      error: () => this.sendingEmail.set(false),
    });
  }

  markSent(): void {
    this.closeActionsMenu();
    const offer = this.offer();
    if (!offer) {
      return;
    }
    this.offerService.updateStatus(offer.id, { status: 'SENT' }).subscribe(() => {
      this.notifications.success('Oferta oznaczona jako wysłana.');
      this.load(offer.id);
    });
  }

  async markSigned(): Promise<void> {
    this.closeActionsMenu();
    const offer = this.offer();
    if (!offer) {
      return;
    }
    const confirmed = await this.confirm.ask({
      title: 'Oznacz jako podpisaną',
      message: 'Oferta zostanie oznaczona jako podpisana i automatycznie zamieni się w event. Tej operacji nie można cofnąć.',
      confirmLabel: 'Podpisz i utwórz event',
    });
    if (!confirmed) {
      return;
    }
    this.offerService.updateStatus(offer.id, { status: 'SIGNED' }).subscribe(() => {
      this.notifications.success('Oferta podpisana — utworzono nowy event.');
      this.load(offer.id);
    });
  }

  async remove(): Promise<void> {
    this.closeActionsMenu();
    const offer = this.offer();
    if (!offer) {
      return;
    }
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
      this.router.navigate(['/offers']);
    });
  }
}
