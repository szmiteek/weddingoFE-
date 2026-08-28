import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employee } from '../../../../core/models/employee.model';
import { EventWorkCreateCommand } from '../../../../core/models/event-work.model';

@Component({
  selector: 'app-event-work-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './event-work-modal.html',
})
export class EventWorkModal {
  private fb = inject(FormBuilder);

  employees = input.required<Employee[]>();
  saving = input(false);

  close = output<void>();
  save = output<Omit<EventWorkCreateCommand, 'eventId'>>();

  protected form = this.fb.nonNullable.group({
    employeeId: [0, [Validators.required, Validators.min(1)]],
    workDate: ['', Validators.required],
    hoursWorked: [1, [Validators.required, Validators.min(0.5)]],
    description: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue());
  }
}
