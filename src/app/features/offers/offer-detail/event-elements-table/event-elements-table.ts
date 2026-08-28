import { DecimalPipe } from '@angular/common';
import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { EventElement } from '../../../../core/models/event-element.model';
import { EventElementService } from '../../../../core/services/event-element.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-event-elements-table',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './event-elements-table.html',
})
export class EventElementsTable {
  private fb = inject(FormBuilder);
  private eventElementService = inject(EventElementService);
  private notifications = inject(NotificationService);

  /** The element's parent — an offer while quoting, an event after signing. */
  offerId = input<number | null>(null);
  eventId = input<number | null>(null);
  elements = input.required<EventElement[]>();
  readOnly = input(false);
  title = input('Wycenione elementy');

  changed = output<EventElement[]>();

  protected saving = signal(false);
  protected editMode = signal(false);

  protected form = this.fb.group({
    rows: this.fb.array<ReturnType<typeof this.createRow>>([]),
  });

  constructor() {
    effect(() => {
      const elements = this.elements();
      // Untracked: rebuildRows reads editMode, and tracking it here would wipe rows added from the empty state.
      untracked(() => this.rebuildRows(elements));
    });

    effect(() => {
      const enabled = !this.readOnly() && this.editMode();
      this.rows.controls.forEach((row) => this.setRowEnabled(row, enabled));
    });
  }

  get rows(): FormArray<ReturnType<typeof this.createRow>> {
    return this.form.get('rows') as FormArray<ReturnType<typeof this.createRow>>;
  }

  private rebuildRows(elements: EventElement[]): void {
    this.rows.clear();
    const enabled = !this.readOnly() && this.editMode();
    for (const element of elements) {
      const row = this.createRow(element.id, element.name, element.quantity, element.unitPrice);
      this.setRowEnabled(row, enabled);
      this.rows.push(row);
    }
  }

  private createRow(id: number | null, name = '', quantity: number | null = null, unitPrice: number | null = null) {
    return this.fb.group({
      id: this.fb.control<number | null>(id),
      name: this.fb.nonNullable.control(name, Validators.required),
      quantity: this.fb.control<number | null>(quantity, Validators.required),
      unitPrice: this.fb.control<number | null>(unitPrice, Validators.required),
    });
  }

  private setRowEnabled(row: ReturnType<typeof this.createRow>, enabled: boolean): void {
    const opts = { emitEvent: false };
    (['name', 'quantity', 'unitPrice'] as const).forEach((field) => {
      const control = row.get(field);
      if (!control) {
        return;
      }
      if (enabled) {
        control.enable(opts);
      } else {
        control.disable(opts);
      }
    });
  }

  startEdit(): void {
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.rebuildRows(this.elements());
    this.editMode.set(false);
  }

  addRow(): void {
    // Adding from the empty state doubles as entering edit mode.
    this.editMode.set(true);
    const row = this.createRow(null);
    this.setRowEnabled(row, true);
    this.rows.push(row);
  }

  rowSum(index: number): number {
    const { quantity, unitPrice } = this.rows.at(index).getRawValue();
    return (quantity ?? 0) * (unitPrice ?? 0);
  }

  total(): number {
    return this.rows.controls.reduce((sum: number, _, i: number) => sum + this.rowSum(i), 0);
  }

  isInvalid(index: number, field: 'name' | 'quantity' | 'unitPrice'): boolean {
    if (this.isRowBlank(index)) {
      return false;
    }
    const control = this.rows.at(index).get(field);
    return !!control && control.invalid;
  }

  private isRowBlank(index: number): boolean {
    const value = this.rows.at(index).getRawValue();
    return !value.name?.trim() && !value.quantity && !value.unitPrice;
  }

  hasInvalidRows(): boolean {
    return this.rows.controls.some((row, index) => !this.isRowBlank(index) && row.invalid);
  }

  hasChanges(): boolean {
    return this.rows.controls.some((row, index) => {
      const value = row.getRawValue();
      return value.id == null ? !this.isRowBlank(index) : row.dirty;
    });
  }

  canSave(): boolean {
    return this.hasChanges() && !this.hasInvalidRows();
  }

  save(): void {
    if (!this.canSave()) {
      return;
    }

    const toSave: { id: number | null; command: { name: string; quantity: number; unitPrice: number } }[] = [];

    this.rows.controls.forEach((row, index) => {
      if (this.isRowBlank(index)) {
        return;
      }
      const value = row.getRawValue();
      toSave.push({
        id: value.id,
        command: {
          name: value.name,
          quantity: value.quantity!,
          unitPrice: value.unitPrice!,
        },
      });
    });

    if (toSave.length === 0) {
      return;
    }

    this.saving.set(true);
    const parent = this.eventId() != null ? { eventId: this.eventId()! } : { offerId: this.offerId()! };
    const requests = toSave.map(({ id, command }) =>
      id == null
        ? this.eventElementService.create({ ...parent, ...command })
        : this.eventElementService.update(id, command),
    );

    forkJoin(requests).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.editMode.set(false);
        this.notifications.success('Zapisano zmiany.');
        this.changed.emit(saved);
      },
      error: () => this.saving.set(false),
    });
  }

  removeRow(index: number): void {
    const row = this.rows.at(index);
    const id = row.getRawValue().id;
    if (id == null) {
      this.rows.removeAt(index);
      return;
    }
    this.eventElementService.delete(id).subscribe(() => {
      this.notifications.success('Element usunięty.');
      this.changed.emit(this.elements().filter((element) => element.id !== id));
    });
  }
}
