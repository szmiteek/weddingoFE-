import { Component, input } from '@angular/core';

@Component({
  selector: 'app-sort-label',
  template: `
    <span class="th-inner">
      <span class="th-label">{{ label() }}</span>
      <span class="material-symbols-outlined th-sort-icon" [class.th-sort-icon--active]="active()">
        {{ active() ? (direction() === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}
      </span>
    </span>
  `,
})
export class SortLabel {
  label = input.required<string>();
  active = input(false);
  direction = input<'asc' | 'desc'>('asc');
}
