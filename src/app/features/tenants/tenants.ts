import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TenantService } from '../../core/services/tenant.service';
import { NotificationService } from '../../core/services/notification.service';
import { Tenant } from '../../core/models/auth.model';
import { AppDatePipe } from '../../shared/pipes/app-date.pipe';

@Component({
  selector: 'app-tenants',
  imports: [ReactiveFormsModule, AppDatePipe],
  templateUrl: './tenants.html',
})
export class Tenants {
  private fb = inject(FormBuilder);
  private tenantService = inject(TenantService);
  private notifications = inject(NotificationService);

  protected tenants = signal<Tenant[]>([]);
  protected formOpen = signal(false);
  protected saving = signal(false);

  protected form = this.fb.nonNullable.group({
    companyName: [''],
    email: [''],
    password: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.tenantService.getAll().subscribe((tenants) => this.tenants.set(tenants));
  }

  openForm(): void {
    this.form.reset({ companyName: '', email: '', password: '' });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  submit(): void {
    this.saving.set(true);
    this.tenantService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.notifications.success('Tenant utworzony.');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  toggleActive(tenant: Tenant): void {
    this.tenantService.setActive(tenant.id, !tenant.active).subscribe(() => {
      this.notifications.success(tenant.active ? 'Tenant dezaktywowany.' : 'Tenant aktywowany.');
      this.load();
    });
  }
}
