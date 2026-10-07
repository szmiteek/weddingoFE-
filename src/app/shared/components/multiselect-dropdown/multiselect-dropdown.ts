import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { Component, ElementRef, computed, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Several choices from a fixed list, as a dropdown with checkboxes. The panel opens in a CDK overlay, so a
 * scrolling container such as a modal never clips it. Works as a form control whose value is the chosen list.
 */
@Component({
  selector: 'app-multiselect-dropdown',
  imports: [CdkOverlayOrigin, CdkConnectedOverlay],
  templateUrl: './multiselect-dropdown.html',
  styleUrl: './multiselect-dropdown.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultiselectDropdown), multi: true }],
})
export class MultiselectDropdown implements ControlValueAccessor {
  options = input<string[]>([]);
  placeholder = input('Wybierz…');
  triggerId = input<string | null>(null);
  /** Red border like on a plain input — the form decides, the control only shows it. */
  invalid = input(false);

  private trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected selected = signal<string[]>([]);
  /** Values saved earlier that aren't among the options stay listed, so saving never silently drops them. */
  private savedValues = signal<string[]>([]);
  protected allOptions = computed(() => [
    ...this.options(),
    ...this.savedValues().filter((value) => !this.options().includes(value)),
  ]);

  protected open = signal(false);
  protected panelWidth = signal(0);
  protected disabled = signal(false);

  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string[] | null): void {
    const values = value ?? [];
    this.selected.set(values);
    this.savedValues.set(values);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
    if (disabled) {
      this.open.set(false);
    }
  }

  protected toggleOpen(): void {
    if (this.open()) {
      this.close();
      return;
    }
    if (this.disabled()) {
      return;
    }
    this.panelWidth.set(this.trigger().nativeElement.getBoundingClientRect().width);
    this.open.set(true);
  }

  protected close(): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.onTouched();
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.trigger().nativeElement.focus();
    }
  }

  protected toggle(option: string): void {
    const selected = this.selected();
    const toggled = selected.includes(option)
      ? selected.filter((value) => value !== option)
      : [...selected, option];
    // Keep the list order rather than the click order.
    const next = this.allOptions().filter((value) => toggled.includes(value));
    this.selected.set(next);
    this.onChange(next);
  }
}
