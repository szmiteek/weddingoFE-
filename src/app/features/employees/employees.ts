import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EmployeeService } from '../../core/services/employee.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Employee, EmployeeCreateCommand } from '../../core/models/employee.model';
import { Paginator } from '../../shared/components/paginator/paginator';
import { EmployeeFormModal } from './employee-form-modal/employee-form-modal';

@Component({
  selector: 'app-employees',
  imports: [Paginator, EmployeeFormModal, DecimalPipe],
  templateUrl: './employees.html',
  styleUrl: './employees.scss',
})
export class Employees {
  private employeeService = inject(EmployeeService);
  private notifications = inject(NotificationService);
  private confirm = inject(ConfirmService);

  protected employees = signal<Employee[]>([]);
  protected loading = signal(true);
  protected currentPage = signal(0);
  protected totalPages = signal(0);
  protected totalElements = signal(0);

  protected modalOpen = signal(false);
  protected editingEmployee = signal<Employee | null>(null);
  protected saving = signal(false);

  ngOnInit(): void {
    this.load(0);
  }

  load(page: number): void {
    this.loading.set(true);
    this.employeeService.getAll(page, 15).subscribe((result) => {
      this.employees.set(result.content);
      this.currentPage.set(result.number);
      this.totalPages.set(result.totalPages);
      this.totalElements.set(result.totalElements);
      this.loading.set(false);
    });
  }

  openCreate(): void {
    this.editingEmployee.set(null);
    this.modalOpen.set(true);
  }

  openEdit(employee: Employee): void {
    this.editingEmployee.set(employee);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  submit(command: EmployeeCreateCommand): void {
    this.saving.set(true);
    const editing = this.editingEmployee();
    const request = editing
      ? this.employeeService.update(editing.id, command)
      : this.employeeService.create(command);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.notifications.success(editing ? 'Dane pracownika zaktualizowane.' : 'Pracownik dodany.');
        this.load(this.currentPage());
      },
      error: () => this.saving.set(false),
    });
  }

  async remove(employee: Employee): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Usuń pracownika',
      message: `Czy na pewno chcesz usunąć ${employee.firstName} ${employee.lastName}? Tej operacji nie można cofnąć.`,
      confirmLabel: 'Usuń',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.employeeService.delete(employee.id).subscribe(() => {
      this.notifications.success('Pracownik usunięty.');
      const isLastOnPage = this.employees().length === 1 && this.currentPage() > 0;
      this.load(isLastOnPage ? this.currentPage() - 1 : this.currentPage());
    });
  }
}
