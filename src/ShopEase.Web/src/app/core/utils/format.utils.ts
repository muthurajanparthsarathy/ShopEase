export function formatCurrency(amount: number): string {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export function calculateTax(subtotal: number, rate = 0.18): number {
  return Math.round(subtotal * rate * 100) / 100;
}

export function calculateShipping(subtotal: number, freeThreshold = 500, shippingFee = 50): number {
  return subtotal >= freeThreshold ? 0 : shippingFee;
}

export function truncate(str: string | null | undefined, maxLen = 50): string {
  if (!str || str.length <= maxLen) return str ?? '';
  return str.substring(0, maxLen) + '...';
}

const STATUS_BADGE_MAP: Record<string, string> = {
  Pending: 'bg-warning text-dark',
  Processing: 'bg-info text-dark',
  Shipped: 'bg-primary',
  Delivered: 'bg-success',
  Cancelled: 'bg-danger',
  Completed: 'bg-success',
  Failed: 'bg-danger',
  Refunded: 'bg-secondary',
  Returned: 'bg-dark',
  'Return Requested': 'bg-warning text-dark',
  Active: 'bg-success',
  Inactive: 'bg-secondary',
};

export function statusBadgeClass(status: string): string {
  return STATUS_BADGE_MAP[status] || 'bg-secondary';
}
