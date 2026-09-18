import { Pipe, PipeTransform } from '@angular/core';

/**
 * Single date format for the whole app: dd.mm.yyyy.
 *
 * Date-only strings from the API are reformatted textually rather than parsed into a Date —
 * `new Date('2027-08-14')` is midnight UTC, which lands on the previous day in timezones behind it.
 */
@Pipe({ name: 'appDate' })
export class AppDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, fallback = '—'): string {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    if (typeof value === 'string') {
      const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
      if (isoDate) {
        const [, year, month, day] = isoDate;
        return `${day}.${month}.${year}`;
      }
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return fallback;
    }
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
  }
}
