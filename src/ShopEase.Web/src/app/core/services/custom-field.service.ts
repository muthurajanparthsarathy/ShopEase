import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { CustomFieldRepository } from '../repositories/custom-field.repository';
import { CustomField, CustomFieldEntity, CustomFieldInput, CustomFieldType } from '../models';

export const CUSTOM_FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox (Yes/No)' },
];

export const CUSTOM_FIELD_ENTITIES: { value: CustomFieldEntity; label: string }[] = [
  { value: 'order', label: 'Orders' },
  { value: 'product', label: 'Products' },
  { value: 'customer', label: 'Customers' },
  { value: 'category', label: 'Categories' },
];

/** Used across admin/products, admin/orders, admin/customers, admin/categories, and admin/dynamic — kept in core. */
@Injectable({ providedIn: 'root' })
export class CustomFieldService {
  private repo = inject(CustomFieldRepository);

  /** Every field across every entity type — the backend's endpoint is entity-scoped, so this composes one call per entity. */
  getAll(): Observable<CustomField[]> {
    const calls = CUSTOM_FIELD_ENTITIES.map((e) => this.repo.getForEntity(e.value, true));
    return forkJoin(calls).pipe(map((lists) => lists.flat()));
  }

  getForEntity(entity: CustomFieldEntity, includeInactive = false): Observable<CustomField[]> {
    return this.repo.getForEntity(entity, includeInactive);
  }

  add(data: CustomFieldInput): Observable<CustomField> {
    return this.repo.add(data);
  }

  update(id: number, patch: Partial<CustomFieldInput>): Observable<void> {
    return this.repo.update(id, patch).pipe(map(() => void 0));
  }

  remove(id: number): Observable<void> {
    return this.repo.remove(id);
  }

  toggleActive(id: number): Observable<void> {
    return this.repo.toggleActive(id).pipe(map(() => void 0));
  }
}
