import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-singleselect-display',
  templateUrl: './singleselect-display.html',
})
export class SingleselectDisplay {
  options = input.required<string[]>();
  value = input<string | null>(null);
  otherLabel = input('Inny');
  showOther = input(true);

  protected isCustom = computed(() => {
    const v = this.value();
    return !!v && !this.options().includes(v);
  });
}
