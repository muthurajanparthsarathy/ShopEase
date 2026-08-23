import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomFieldService, CUSTOM_FIELD_ENTITIES, CUSTOM_FIELD_TYPES } from '../../../core/services/custom-field.service';
import { ToastService } from '../../../core/services/toast.service';
import { CustomField, CustomFieldEntity, CustomFieldType } from '../../../core/models';
import { LookupManagementService, LOOKUPS, COLORS, LookupItem } from './lookup-management.service';
import { statusBadgeClass } from '../../../core/utils/format.utils';

declare const bootstrap: any;

@Component({
  selector: 'app-admin-dynamic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dynamic.component.html',
})
export class AdminDynamicComponent implements AfterViewInit {
  private customFieldSvc = inject(CustomFieldService);
  private lookupSvc = inject(LookupManagementService);
  private toast = inject(ToastService);

  @ViewChild('fieldModalEl') fieldModalEl!: ElementRef<HTMLDivElement>;
  private fieldModal: any;

  entities = CUSTOM_FIELD_ENTITIES;
  types = CUSTOM_FIELD_TYPES;
  lookups = LOOKUPS;
  colors = COLORS;

  allFields = signal<CustomField[]>([]);
  filterEntity = signal('');
  filterStatus = signal('');

  editingId = signal<number | null>(null);
  fLabel = signal('');
  fEntity = signal<CustomFieldEntity>('order');
  fType = signal<CustomFieldType>('text');
  fOptions = signal('');
  fRequired = signal(false);
  fActive = signal(true);
  submitted = signal(false);

  lookupRefresh = signal(0);
  addLookupValue: Record<string, string> = {};
  addLookupColor: Record<string, string> = {};

  constructor() {
    this.customFieldSvc.getAll().subscribe((fields) => {
      if (!fields.length) {
        // Seed a few sample Order fields the first time, mirroring the reference app.
        this.customFieldSvc.add({ label: 'Courier Partner', entity: 'order', type: 'text', options: [], required: false, active: true }).subscribe();
        this.customFieldSvc.add({ label: 'Priority', entity: 'order', type: 'dropdown', options: ['Low', 'Medium', 'High'], required: false, active: true }).subscribe();
        this.customFieldSvc.add({ label: 'Gift Wrap', entity: 'order', type: 'checkbox', options: [], required: false, active: true }).subscribe(() => this.reload());
      } else {
        this.allFields.set(fields);
      }
    });
    for (const lk of LOOKUPS) { this.addLookupValue[lk.key] = ''; this.addLookupColor[lk.key] = COLORS[0].v; }
  }

  ngAfterViewInit(): void {
    this.fieldModal = new bootstrap.Modal(this.fieldModalEl.nativeElement);
  }

  private reload(): void {
    this.customFieldSvc.getAll().subscribe((fields) => this.allFields.set(fields));
  }

  filteredFields(): CustomField[] {
    let fields = this.allFields();
    if (this.filterEntity()) fields = fields.filter((f) => f.entity === this.filterEntity());
    if (this.filterStatus() === 'active') fields = fields.filter((f) => f.active);
    if (this.filterStatus() === 'inactive') fields = fields.filter((f) => !f.active);
    return fields;
  }

  clearFilters(): void {
    this.filterEntity.set('');
    this.filterStatus.set('');
    this.toast.show('Filters cleared.', 'info');
  }

  entityLabel(v: string): string {
    return this.entities.find((e) => e.value === v)?.label ?? v;
  }
  typeLabel(v: string): string {
    return this.types.find((t) => t.value === v)?.label ?? v;
  }

  openAdd(): void {
    this.editingId.set(null);
    this.fLabel.set(''); this.fEntity.set('order'); this.fType.set('text'); this.fOptions.set(''); this.fRequired.set(false); this.fActive.set(true);
    this.submitted.set(false);
    this.fieldModal.show();
  }

  openEdit(f: CustomField): void {
    this.editingId.set(f.id);
    this.fLabel.set(f.label); this.fEntity.set(f.entity); this.fType.set(f.type);
    this.fOptions.set((f.options || []).join(', ')); this.fRequired.set(f.required); this.fActive.set(f.active);
    this.submitted.set(false);
    this.fieldModal.show();
  }

  toggleActive(f: CustomField): void {
    this.customFieldSvc.toggleActive(f.id).subscribe(() => {
      this.reload();
      this.toast.show(`Field ${f.active ? 'deactivated' : 'activated'}.`, 'info');
    });
  }

  async deleteField(f: CustomField): Promise<void> {
    const ok = await this.toast.confirm(`Delete field "${f.label}"? Existing saved values are not removed.`, 'danger');
    if (!ok) return;
    this.customFieldSvc.remove(f.id).subscribe(() => {
      this.reload();
      this.toast.show('Field deleted.', 'success');
    });
  }

  async saveField(): Promise<void> {
    this.submitted.set(true);
    const label = this.fLabel().trim();
    const options = this.fOptions().split(',').map((s) => s.trim()).filter(Boolean);
    if (!label) return;
    if (this.fType() === 'dropdown' && !options.length) return;

    const data = { label, entity: this.fEntity(), type: this.fType(), options: this.fType() === 'dropdown' ? options : [], required: this.fRequired(), active: this.fActive() };
    const editId = this.editingId();

    const ok = await this.toast.confirm(editId ? 'Save changes to this field?' : `Create field "${label}"?`, 'info');
    if (!ok) return;

    const onDone = () => {
      this.reload();
      this.fieldModal.hide();
      this.toast.show(editId ? 'Field updated.' : 'Field created.', 'success');
    };
    if (editId) this.customFieldSvc.update(editId, data).subscribe(onDone);
    else this.customFieldSvc.add(data).subscribe(onDone);
  }

  // ── Lookups & statuses ──
  lookupItems(key: string): LookupItem[] {
    this.lookupRefresh(); // depend on refresh signal so the template re-evaluates after add/remove
    return this.lookupSvc.getList(key);
  }

  badgeClassFor(kind: string, name: string): string {
    return kind === 'status' ? statusBadgeClass(name) : 'bg-light text-dark border';
  }

  async addLookup(key: string, label: string, kind: 'status' | 'method'): Promise<void> {
    const name = (this.addLookupValue[key] || '').trim();
    if (!name) { this.toast.show('Enter a name.', 'error'); return; }
    const ok = await this.toast.confirm(`Add "${name}" to ${label}?`, 'info');
    if (!ok) return;
    const result = this.lookupSvc.add(key, name, kind === 'status' ? this.addLookupColor[key] : undefined);
    this.toast.show(result.message, result.success ? 'success' : 'error');
    if (result.success) { this.addLookupValue[key] = ''; this.lookupRefresh.update((v) => v + 1); }
  }

  async removeLookup(key: string, label: string, name: string): Promise<void> {
    if (this.lookupSvc.isInUse(key, name)) { this.toast.show(`Cannot delete "${name}" — it is in use by existing records.`, 'error'); return; }
    const ok = await this.toast.confirm(`Delete "${name}" from ${label}?`, 'danger');
    if (!ok) return;
    const result = this.lookupSvc.remove(key, name);
    this.toast.show(result.message, result.success ? 'success' : 'error');
    if (result.success) this.lookupRefresh.update((v) => v + 1);
  }
}
