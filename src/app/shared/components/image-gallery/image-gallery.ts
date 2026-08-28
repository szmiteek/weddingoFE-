import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { OfferImage } from '../../../core/models/offer-image.model';
import { OfferImageService } from '../../../core/services/offer-image.service';

@Component({
  selector: 'app-image-gallery',
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

    this.destroyRef.onDestroy(() => {
      Object.values(this.objectUrls()).forEach((url) => URL.revokeObjectURL(url));
    });
  }

  urlFor(image: OfferImage): string | null {
    return this.objectUrls()[image.id] ?? null;
  }

  removeClicked(image: OfferImage, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.remove.emit(image);
  }
}
