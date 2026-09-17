import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Shows a generated PDF inside the app, rendered by the browser's own PDF viewer.
 * The file is passed in as a blob, so the preview costs no extra request after generating.
 */
@Component({
  selector: 'app-pdf-preview-modal',
  templateUrl: './pdf-preview-modal.html',
  styleUrl: './pdf-preview-modal.scss',
  host: {
    '(document:keydown.escape)': 'close.emit()',
  },
})
export class PdfPreviewModal {
  private sanitizer = inject(DomSanitizer);

  pdf = input.required<Blob>();
  title = input('Podgląd oferty');

  close = output<void>();
  download = output<void>();
  openExternally = output<void>();

  private url = signal<string | null>(null);

  protected safeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.url();
    // The URL is one this component just created from the blob — never anything the user typed.
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  constructor() {
    effect((onCleanup) => {
      const url = URL.createObjectURL(this.pdf());
      this.url.set(url);
      onCleanup(() => URL.revokeObjectURL(url));
    });
  }
}
