import { Component, computed, input } from '@angular/core';

/** Read-only 5-star display, ported from Helpers.renderStars. */
@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: `
    <span class="rating-row">
      @for (state of stars(); track $index) {
        <i class="bi" [class.bi-star-fill]="state === 'full'" [class.bi-star-half]="state === 'half'" [class.bi-star]="state === 'empty'" [class.text-warning]="true"></i>
      }
    </span>
  `,
})
export class StarRatingComponent {
  rating = input(0);

  stars = computed(() => {
    const full = Math.floor(this.rating());
    const half = this.rating() - full >= 0.5;
    return Array.from({ length: 5 }, (_, i) => {
      const n = i + 1;
      if (n <= full) return 'full';
      if (n === full + 1 && half) return 'half';
      return 'empty';
    });
  });
}
