import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { OfferImage } from '../../../core/models/offer-image.model';
import { OfferImageService } from '../../../core/services/offer-image.service';
import { ImageLightbox, LightboxImage } from '../image-lightbox/image-lightbox';

@Component({
  selector: 'app-image-gallery',
  imports: [ImageLightbox],
  templateUrl: './image-gallery.html',
  styleUrl: './image-gallery.scss',
})
export class ImageGallery {
  private imageService = inject(OfferImageService);
  private destroyRef = inject(DestroyRef);

  images = input.required<OfferImage[]>();
  deletable = input(false);
  emptyText = input('Brak zdjęć inspiracji.');

  remove = output<OfferImage>();

  private objectUrls = signal<Record<number, string>>({});

  protected lightboxOpen = signal(false);
  protected lightboxIndex = signal(0);
  protected lightboxImages = computed<LightboxImage[]>(() =>
    this.images().map((image) => ({ url: this.objectUrls()[image.id] ?? null, caption: image.filename })),
  );

  constructor() {
    effect(() => {
      for (const image of this.images()) {
        if (this.objectUrls()[image.id]) {
          continue;
        }
        this.imageService.fetchContent(image.id).subscribe((blob) => {
          const url = URL.createObjectURL(blob);
          this.objectUrls.update((map) => ({ ...map, [image.id]: url }));
        });
      }
    });

    // A deleted picture must not leave the preview showing the wrong one — or nothing at all.
    effect(() => {
      const count = this.images().length;
      if (count === 0) {
        this.lightboxOpen.set(false);
      } else if (this.lightboxIndex() >= count) {
        this.lightboxIndex.set(count - 1);
      }
    });

    this.destroyRef.onDestroy(() => {
      Object.values(this.objectUrls()).forEach((url) => URL.revokeObjectURL(url));
    });
  }

  urlFor(image: OfferImage): string | null {
    return this.objectUrls()[image.id] ?? null;
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  removeClicked(image: OfferImage, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.remove.emit(image);
  }
}
