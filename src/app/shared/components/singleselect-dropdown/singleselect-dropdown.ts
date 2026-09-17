import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * One choice from a fixed list plus "Inny" with free text — the client form's radio group as a dropdown.
 * Works as a form control: its value is the chosen option or the typed text.
 */
@Component({
  selector: 'app-singleselect-dropdown',
  templateUrl: './singleselect-dropdown.html',
  styleUrl: './singleselect-dropdown.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SingleselectDropdown), multi: true }],
})
export class SingleselectDropdown implements ControlValueAccessor {
  options = input<string[]>([]);
  otherLabel = input('Inny');
  selectId = input<string | null>(null);

  protected readonly OTHER = '__other__';
  protected value = signal('');
  /** Picking "Inny" must stick while its text is still empty, so it can't be read off the value alone. */
  private otherPicked = signal(false);
  protected disabled = signal(false);

  protected choice = computed(() => {
    const value = this.value();
    return this.otherPicked() || (value !== '' && !this.options().includes(value)) ? this.OTHER : value;
  });

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.otherPicked.set(false);
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected select(choice: string): void {
    const other = choice === this.OTHER;
    this.otherPicked.set(other);
    // Switching to "Inny" starts with empty text rather than keeping the previous option.
    this.update(other ? '' : choice);
  }

  protected setCustom(text: string): void {
    this.update(text);
  }

  private update(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }
}
