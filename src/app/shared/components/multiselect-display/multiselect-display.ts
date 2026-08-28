import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-multiselect-display',
  templateUrl: './multiselect-display.html',
})
export class MultiselectDisplay {
  options = input.required<string[]>();
  selected = input<string[]>([]);

  protected customValues = computed(() => this.selected().filter((v) => !this.options().includes(v)));
}
