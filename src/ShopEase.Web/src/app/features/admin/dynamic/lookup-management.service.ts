import { Injectable, inject } from '@angular/core';
import { StorageService } from '../../../core/utils/storage.service';
import { Order, Payment } from '../../../core/models';

export interface LookupItem {
  id: number;
  name: string;
}

export type LookupKind = 'status' | 'method';

export interface LookupDef {
  key: string;
  label: string;
  icon: string;
  kind: LookupKind;
}

export const LOOKUPS: LookupDef[] = [
  { key: 'se_order_statuses', label: 'Order Statuses', icon: 'bag-check', kind: 'status' },
  { key: 'se_payment_statuses', label: 'Payment Statuses', icon: 'credit-card', kind: 'status' },
  { key: 'se_payment_methods', label: 'Payment Methods', icon: 'wallet2', kind: 'method' },
];

export const COLORS = [
  { v: 'bg-success', l: 'Green' }, { v: 'bg-danger', l: 'Red' }, { v: 'bg-warning text-dark', l: 'Yellow' },
  { v: 'bg-info text-dark', l: 'Cyan' }, { v: 'bg-primary', l: 'Blue' }, { v: 'bg-secondary', l: 'Grey' }, { v: 'bg-dark', l: 'Black' },
];

// Only consumed by the admin "Dynamic Handling" page — simple CRUD over the seeded lookup lists.
@Injectable({ providedIn: 'root' })
export class LookupManagementService {
  private storage = inject(StorageService);

  getList(key: string): LookupItem[] {
    return this.storage.get<LookupItem[]>(key) || [];
  }

  getMeta(): Record<string, string> {
    return this.storage.get<Record<string, string>>('se_status_meta') || {};
  }

  isInUse(key: string, name: string): boolean {
    if (key === 'se_order_statuses') return (this.storage.get<Order[]>('se_orders') || []).some((o) => o.status === name);
    if (key === 'se_payment_statuses') return (this.storage.get<Payment[]>('se_payments') || []).some((p) => p.status === name);
    if (key === 'se_payment_methods') return (this.storage.get<Payment[]>('se_payments') || []).some((p) => p.method === name);
    return false;
  }

  add(key: string, name: string, color?: string): { success: boolean; message: string } {
    const list = this.getList(key);
    if (list.some((it) => it.name.toLowerCase() === name.toLowerCase())) return { success: false, message: `"${name}" already exists.` };
    const nextId = list.length ? Math.max(...list.map((i) => i.id)) + 1 : 1;
    this.storage.set(key, [...list, { id: nextId, name }]);
    if (color) {
      const meta = this.getMeta();
      meta[name] = color;
      this.storage.set('se_status_meta', meta);
    }
    return { success: true, message: `"${name}" added.` };
  }

  remove(key: string, name: string): { success: boolean; message: string } {
    if (this.isInUse(key, name)) return { success: false, message: `Cannot delete "${name}" — it is in use by existing records.` };
    this.storage.set(key, this.getList(key).filter((it) => it.name !== name));
    const meta = this.getMeta();
    if (meta[name]) { delete meta[name]; this.storage.set('se_status_meta', meta); }
    return { success: true, message: `"${name}" deleted.` };
  }
}
