import { Component, computed, input, output } from '@angular/core';
import { PageInfo } from '../../../core/utils/pagination.utils';

type PageItem = number | 'ellipsis';

/** Windows the page list around the current page (siblings=1, boundaries=1), e.g. 1 … 5 6 7 … 20. */
function buildPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const keep = new Set<number>([1, total]);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= total) keep.add(p);
  }
  const sorted = Array.from(keep).sort((a, b) => a - b);
  const items: PageItem[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) items.push('ellipsis');
    items.push(p);
    prev = p;
  }
  return items;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  page = input.required<PageInfo>();
  ariaLabel = input('Pagination');

  pageChange = output<number>();

  pageItems = computed<PageItem[]>(() => buildPageItems(this.page().currentPage, this.page().totalPages));

  goTo(target: number): void {
    const info = this.page();
    const next = Math.max(1, Math.min(target, info.totalPages));
    if (next !== info.currentPage) this.pageChange.emit(next);
  }
}
