import { Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

export type LoaderPhase = 'hidden' | 'anim' | 'progress';

/**
 * Tiered loading UX, ported from loader.js:
 *   < 300ms  -> nothing shown
 *   300ms-3s -> animated cart overlay
 *   > 3s     -> progress bar + status message
 */
@Injectable({ providedIn: 'root' })
export class LoaderService {
  readonly phase = signal<LoaderPhase>('hidden');
  readonly message = signal('Working…');

  async run<T>(source: Observable<T> | Promise<T>, opts: { message?: string; progressMessage?: string } = {}): Promise<T> {
    const { message = 'Working…', progressMessage = 'Fetching data…' } = opts;
    this.message.set(message);

    const showTimer = setTimeout(() => this.phase.set('anim'), 300);
    const progressTimer = setTimeout(() => { this.phase.set('progress'); this.message.set(progressMessage); }, 3000);

    try {
      return source instanceof Promise ? await source : await firstValueFrom(source);
    } finally {
      clearTimeout(showTimer);
      clearTimeout(progressTimer);
      this.phase.set('hidden');
    }
  }

  setMessage(text: string): void {
    this.message.set(text);
  }
}
