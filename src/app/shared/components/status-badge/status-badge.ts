import { Component, computed, input } from '@angular/core';
import { OfferStatus } from '../../../core/models/offer.model';

const LABELS: Record<OfferStatus, string> = {
  NOT_READY: 'Nieprzygotowana',
  READY: 'Przygotowana',
  SENT: 'Wysłana',
  SIGNED: 'Podpisana',
};

const CLASSES: Record<OfferStatus, string> = {
  NOT_READY: 'badge--not-ready',
  READY: 'badge--ready',
  SENT: 'badge--sent',
  SIGNED: 'badge--signed',
};

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="cssClass()">{{ label() }}</span>`,
})
export class StatusBadge {
  status = input.required<OfferStatus>();

  protected readonly label = computed(() => LABELS[this.status()]);
  protected readonly cssClass = computed(() => CLASSES[this.status()]);
}
