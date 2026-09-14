import { DOCUMENT, EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';

/**
 * Stops the mouse wheel from changing number inputs anywhere in the app, public client forms included.
 *
 * Browsers only step a number input on wheel while it has focus, so blurring it first leaves the
 * typed value untouched and lets the wheel scroll the page as usual. The listener is passive and
 * never cancels the event — page scrolling over the input keeps working.
 */
export function provideNumberInputWheelGuard(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const document = inject(DOCUMENT);
    document.addEventListener(
      'wheel',
      (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement && target.type === 'number' && target === document.activeElement) {
          target.blur();
        }
      },
      { capture: true, passive: true },
    );
  });
}
