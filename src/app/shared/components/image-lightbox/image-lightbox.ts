import { Component, computed, input, model, output } from '@angular/core';

export interface LightboxImage {
  /** null while the picture is still being fetched. */
  url: string | null;
  caption?: string;
}

/** Full-screen preview of one picture from a list, with arrows, keyboard control and a counter. */
@Component({
  selector: 'app-image-lightbox',
  templateUrl: './image-lightbox.html',
  styleUrl: './image-lightbox.scss',
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class ImageLightbox {
  images = input.required<LightboxImage[]>();
  index = model.required<number>();

  close = output<void>();

  protected current = computed(() => this.images()[this.index()] ?? null);
  protected hasPrevious = computed(() => this.index() > 0);
  protected hasNext = computed(() => this.index() < this.images().length - 1);

  protected previous(): void {
    if (this.hasPrevious()) {
      this.index.update((index) => index - 1);
    }
  }

  protected next(): void {
    if (this.hasNext()) {
      this.index.update((index) => index + 1);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    }
  }

  /** Only a click on the dark area closes the preview — clicks on the picture or the buttons don't. */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
