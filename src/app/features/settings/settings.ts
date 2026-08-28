import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MailConnectionStatus } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { MailIntegrationService } from '../../core/services/mail-integration.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private fb = inject(FormBuilder);
  protected authService = inject(AuthService);
  private mailIntegration = inject(MailIntegrationService);
  private notifications = inject(NotificationService);
  private confirm = inject(ConfirmService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected saving = signal(false);
  protected mismatch = signal(false);
  protected regenerating = signal(false);
  protected copied = signal(false);
  protected activeSection = signal<'password' | 'form' | 'email'>('password');
  protected savingEmailSettings = signal(false);
  protected mailConnection = signal<MailConnectionStatus | null>(null);
  protected connecting = signal(false);

  protected form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  protected emailForm = this.fb.nonNullable.group({
    emailMessage: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.authService.isSuperAdmin()) {
      return;
    }
    this.authService.getEmailSettings().subscribe((settings) => {
      this.emailForm.patchValue({ emailMessage: settings.emailMessage ?? '' });
    });
    this.loadMailConnection();
    this.handleOAuthRedirect();
  }

  private loadMailConnection(): void {
    this.mailIntegration.getStatus().subscribe((status) => this.mailConnection.set(status));
  }

  /** The Google callback bounces the browser back here with a result flag. */
  private handleOAuthRedirect(): void {
    const params = this.route.snapshot.queryParamMap;
    const result = params.get('mail');
    if (!result) {
      return;
    }
    this.activeSection.set('email');
    if (result === 'connected') {
      this.notifications.success('Konto Google zostało połączone.');
    } else {
      this.notifications.error(params.get('message') ?? 'Nie udało się połączyć konta Google.');
    }
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  connectGoogle(): void {
    this.connecting.set(true);
    this.mailIntegration.getGoogleAuthorizationUrl().subscribe({
      next: ({ authorizationUrl }) => {
        window.location.href = authorizationUrl;
      },
      error: () => this.connecting.set(false),
    });
  }

  async disconnectMail(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Odłącz konto Google',
      message: 'Nie będziesz mógł wysyłać ofert e-mailem, dopóki nie podłączysz konta ponownie.',
      confirmLabel: 'Odłącz',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.mailIntegration.disconnect().subscribe(() => {
      this.notifications.success('Konto Google zostało odłączone.');
      this.loadMailConnection();
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    if (value.newPassword !== value.confirmPassword) {
      this.mismatch.set(true);
      return;
    }
    this.mismatch.set(false);
    this.saving.set(true);
    this.authService
      .changePassword({ currentPassword: value.currentPassword, newPassword: value.newPassword })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.reset();
          this.notifications.success('Hasło zostało zmienione.');
        },
        error: () => this.saving.set(false),
      });
  }

  publicFormUrl(): string {
    const token = this.authService.currentUser()?.publicFormToken;
    return token ? `${location.origin}/formularz/${token}` : '';
  }

  async copyLink(): Promise<void> {
    await navigator.clipboard.writeText(this.publicFormUrl());
    this.copied.set(true);
    this.notifications.success('Link skopiowany.');
    setTimeout(() => this.copied.set(false), 2000);
  }

  submitEmailSettings(): void {
    if (this.emailForm.invalid) {
      return;
    }
    this.savingEmailSettings.set(true);
    this.authService.updateEmailSettings(this.emailForm.getRawValue()).subscribe({
      next: () => {
        this.savingEmailSettings.set(false);
        this.notifications.success('Ustawienia e-mail zostały zapisane.');
      },
      error: () => this.savingEmailSettings.set(false),
    });
  }

  async regenerateLink(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Wygeneruj nowy link',
      message: 'Obecny link do formularza przestanie działać. Będziesz musiał podmienić go wszędzie, gdzie go umieściłeś.',
      confirmLabel: 'Wygeneruj nowy link',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.regenerating.set(true);
    this.authService.regeneratePublicFormToken().subscribe({
      next: () => {
        this.regenerating.set(false);
        this.notifications.success('Wygenerowano nowy link.');
      },
      error: () => this.regenerating.set(false),
    });
  }
}
