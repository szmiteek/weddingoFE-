import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MailConnectionStatus } from '../../core/models/auth.model';
import { OfferSettings, PdfOrientation } from '../../core/models/offer-settings.model';
import { AuthService } from '../../core/services/auth.service';
import { MailIntegrationService } from '../../core/services/mail-integration.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { OfferSettingsService } from '../../core/services/offer-settings.service';

type SettingsSection = 'password' | 'form' | 'email' | 'offer';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_CONTENT_TYPES = ['image/png', 'image/jpeg'];

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private fb = inject(FormBuilder);
  protected authService = inject(AuthService);
  private mailIntegration = inject(MailIntegrationService);
  private offerSettingsService = inject(OfferSettingsService);
  private notifications = inject(NotificationService);
  private confirm = inject(ConfirmService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected saving = signal(false);
  protected mismatch = signal(false);
  protected regenerating = signal(false);
  protected copied = signal(false);
  protected activeSection = signal<SettingsSection>('password');
  protected savingEmailSettings = signal(false);
  protected mailConnection = signal<MailConnectionStatus | null>(null);
  protected connecting = signal(false);

  protected offerSettings = signal<OfferSettings | null>(null);
  protected selectedInfoFields = signal<string[]>([]);
  protected savingOfferSettings = signal(false);
  protected uploadingLogo = signal(false);
  protected logoUrl = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  protected emailForm = this.fb.nonNullable.group({
    emailMessage: ['', Validators.required],
  });

  protected offerForm = this.fb.nonNullable.group({
    backgroundColor: ['#FFFFFF', [Validators.required, Validators.pattern(HEX_COLOR)]],
    orientation: ['LANDSCAPE' as PdfOrientation, Validators.required],
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.setLogoUrl(null));
  }

  ngOnInit(): void {
    if (this.authService.isSuperAdmin()) {
      return;
    }
    this.authService.getEmailSettings().subscribe((settings) => {
      this.emailForm.patchValue({ emailMessage: settings.emailMessage ?? '' });
    });
    this.loadMailConnection();
    this.handleOAuthRedirect();
    this.loadOfferSettings();
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

  // ---- Ustawienia oferty ----

  private loadOfferSettings(): void {
    this.offerSettingsService.get().subscribe((settings) => {
      this.applyOfferSettings(settings);
      if (settings.hasLogo) {
        this.offerSettingsService.fetchLogo().subscribe((blob) => this.setLogoUrl(URL.createObjectURL(blob)));
      }
    });
  }

  private applyOfferSettings(settings: OfferSettings): void {
    this.offerSettings.set(settings);
    this.selectedInfoFields.set(settings.infoFields);
    this.offerForm.setValue({ backgroundColor: settings.backgroundColor, orientation: settings.orientation });
    this.offerForm.markAsPristine();
  }

  private setLogoUrl(url: string | null): void {
    const previous = this.logoUrl();
    if (previous) {
      URL.revokeObjectURL(previous);
    }
    this.logoUrl.set(url);
  }

  isInfoFieldSelected(key: string): boolean {
    return this.selectedInfoFields().includes(key);
  }

  infoFieldsFull(): boolean {
    const settings = this.offerSettings();
    return !!settings && this.selectedInfoFields().length >= settings.maxInfoFields;
  }

  toggleInfoField(key: string): void {
    const settings = this.offerSettings();
    if (!settings) {
      return;
    }
    const selected = this.selectedInfoFields();
    if (selected.includes(key)) {
      this.selectedInfoFields.set(selected.filter((selectedKey) => selectedKey !== key));
      return;
    }
    if (selected.length >= settings.maxInfoFields) {
      return;
    }
    // New fields go to the end; the tenant arranges them in the order list.
    this.selectedInfoFields.set([...selected, key]);
  }

  /** The list order is the order the fields appear in the PDF. */
  reorderInfoField(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const fields = [...this.selectedInfoFields()];
    moveItemInArray(fields, event.previousIndex, event.currentIndex);
    this.selectedInfoFields.set(fields);
  }

  infoFieldLabel(key: string): string {
    return this.offerSettings()?.availableFields.find((field) => field.key === key)?.label ?? key;
  }

  selectedInfoFieldLabels(): string[] {
    return this.selectedInfoFields().map((key) => this.infoFieldLabel(key));
  }

  previewTextColor(): string {
    return readableTextColor(this.offerForm.controls.backgroundColor.value);
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset so picking the same file again still fires a change event.
    input.value = '';
    if (!file) {
      return;
    }
    if (!LOGO_CONTENT_TYPES.includes(file.type)) {
      this.notifications.error('Logo musi być plikiem PNG lub JPG.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      this.notifications.error('Logo może mieć maksymalnie 2 MB.');
      return;
    }
    this.uploadingLogo.set(true);
    this.offerSettingsService.uploadLogo(file).subscribe({
      next: (settings) => {
        this.uploadingLogo.set(false);
        // Only the logo changed — keep any unsaved edits to colour, orientation and fields.
        this.offerSettings.update((current) => (current ? { ...current, hasLogo: settings.hasLogo } : settings));
        this.setLogoUrl(URL.createObjectURL(file));
        this.notifications.success('Logo zostało zapisane.');
      },
      error: () => this.uploadingLogo.set(false),
    });
  }

  async removeLogo(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Usuń logo',
      message: 'Logo zniknie z nowo generowanych ofert. Pliki wygenerowane wcześniej się nie zmienią.',
      confirmLabel: 'Usuń logo',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.offerSettingsService.deleteLogo().subscribe((settings) => {
      this.offerSettings.update((current) => (current ? { ...current, hasLogo: settings.hasLogo } : settings));
      this.setLogoUrl(null);
      this.notifications.success('Logo zostało usunięte.');
    });
  }

  saveOfferSettings(): void {
    if (this.offerForm.invalid || this.selectedInfoFields().length === 0) {
      return;
    }
    const value = this.offerForm.getRawValue();
    this.savingOfferSettings.set(true);
    this.offerSettingsService
      .update({
        backgroundColor: value.backgroundColor,
        orientation: value.orientation,
        infoFields: this.selectedInfoFields(),
      })
      .subscribe({
        next: (settings) => {
          this.savingOfferSettings.set(false);
          this.applyOfferSettings(settings);
          this.notifications.success('Ustawienia oferty zostały zapisane.');
        },
        error: () => this.savingOfferSettings.set(false),
      });
  }
}

/** Mirrors the PDF renderer: dark or light text, whichever contrasts more with the background. */
function readableTextColor(hex: string): string {
  const dark = '#222430';
  const light = '#F6F6F8';
  if (!HEX_COLOR.test(hex)) {
    return dark;
  }
  const luminance = (color: string) => {
    const [r, g, b] = [1, 3, 5]
      .map((start) => parseInt(color.slice(start, start + 2), 16) / 255)
      .map((channel) => (channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const background = luminance(hex);
  return contrast(luminance(dark), background) >= contrast(luminance(light), background) ? dark : light;
}
