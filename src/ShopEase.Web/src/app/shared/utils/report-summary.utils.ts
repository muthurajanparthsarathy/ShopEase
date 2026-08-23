import { formatCurrency } from '../../core/utils/format.utils';

const COUNT_KEYS = new Set([
  'totalOrders', 'totalPayments', 'itemCount', 'cancelledOrders', 'totalProducts',
  'outOfStock', 'totalCustomers', 'activeCount', 'inactiveCount', 'totalTransactions', 'failed',
]);

const BADGE_STATUSES = new Set(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Completed', 'Failed', 'Refunded']);

export interface SummaryEntry {
  key: string;
  label: string;
  display: string;
}

export function summaryEntries(summary: Record<string, number>): SummaryEntry[] {
  return Object.entries(summary).map(([key, val]) => ({
    key,
    label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
    display: COUNT_KEYS.has(key) ? String(val) : formatCurrency(val),
  }));
}

export function isBadgeStatus(cell: string | number): boolean {
  return BADGE_STATUSES.has(String(cell));
}
