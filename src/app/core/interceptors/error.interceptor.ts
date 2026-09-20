import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api-error.model';
import { NotificationService } from '../services/notification.service';

const FIELD_LABELS: Record<string, string> = {
  firstName: 'Imię',
  lastName: 'Nazwisko',
  hourlyRate: 'Stawka godzinowa',
  personalData: 'Dane klienta',
  venue: 'Miejsce',
  eventDate: 'Data eventu',
  email: 'E-mail',
  phone: 'Telefon',
  budget: 'Budżet',
  guests: 'Liczba gości',
  status: 'Status',
  colors: 'Kolorystyka',
  description: 'Opis',
  eventType: 'Rodzaj wydarzenia',
  afterWeddingParty: 'Poprawiny',
  decorationType: 'Rodzaj kompozycji',
  mainTableType: 'Typ stołu prezydialnego',
  mainTableSeats: 'Przy stole prezydialnym będziemy siedzieć',
  guestsTableType: 'Typ stołów gości',
  flowersType: 'Rodzaj kwiatów',
};

const VIOLATION_MESSAGES: Record<string, string> = {
  EMPTY_VALUE: 'nie może być puste',
  TO_LOW_VALUE: 'wartość jest za niska',
  DATE_IN_PAST: 'data nie może być w przeszłości',
  NOT_EMAIL: 'nieprawidłowy adres e-mail',
  NULL_VALUE: 'jest wymagane',
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      notifications.error(buildMessage(error));
      return throwError(() => error);
    }),
  );
};

function buildMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Brak połączenia z serwerem. Sprawdź, czy backend działa na porcie 8080.';
  }

  const body = error.error as ApiError | undefined;

  if (body?.violations?.length) {
    return body.violations
      .map((v) => `${FIELD_LABELS[v.field] ?? v.field}: ${VIOLATION_MESSAGES[v.message] ?? v.message}`)
      .join('; ');
  }

  if (body?.message) {
    return body.message;
  }

  return `Wystąpił błąd (${error.status}).`;
}
