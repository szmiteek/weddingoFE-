import { Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  protected notifications = inject(NotificationService);

  iconFor(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '!';
      default:
        return 'i';
    }
  }
}
