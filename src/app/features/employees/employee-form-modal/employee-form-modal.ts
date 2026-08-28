import { Component, computed, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employee, EmployeeCreateCommand } from '../../../core/models/employee.model';

@Component({
  selector: 'app-employee-form-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './employee-form-modal.html',
})
export class EmployeeFormModal {
  private fb = inject(FormBuilder);

  employee = input<Employee | null>(null);
  saving = input(false);

  close = output<void>();
  save = output<EmployeeCreateCommand>();

  protected readonly isEdit = computed(() => this.employee() !== null);

  protected form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    hourlyRate: [30, [Validators.required, Validators.min(30)]],
  });

  ngOnInit(): void {
    const employee = this.employee();
    if (employee) {
      this.form.setValue({
        firstName: employee.firstName,
        lastName: employee.lastName,
        hourlyRate: employee.hourlyRate,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue());
  }
}
