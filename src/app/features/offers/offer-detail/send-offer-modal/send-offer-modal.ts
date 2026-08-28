import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-send-offer-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './send-offer-modal.html',
})
export class SendOfferModal {
  private fb = inject(FormBuilder);

  email = input.required<string>();
  sending = input(false);
  resend = input(false);

  close = output<void>();
  send = output<string>();

  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.form.setValue({ email: this.email() ?? '' });
  }

  protected get changed(): boolean {
    return this.form.getRawValue().email.trim() !== (this.email() ?? '').trim();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.send.emit(this.form.getRawValue().email.trim());
  }
}
