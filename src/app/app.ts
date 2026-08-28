import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './layout/toast/toast';
import { ConfirmDialog } from './layout/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, ConfirmDialog],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
