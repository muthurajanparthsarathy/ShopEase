import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomFieldService } from '../../../core/services/custom-field.service';
import { CustomField, CustomFieldEntity } from '../../../core/models';

/** Read-only display of an entity's custom-field values, for view modals. */
@Component({
  selector: 'app-custom-fields-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (fields().length) {
      <hr class="my-1">
      <label class="form-label text-muted small mb-1"><i class="bi bi-ui-checks-grid"></i> Additional Details</label>
      @for (f of fields(); track f.id) {
        <div class="d-flex justify-content-between border-bottom py-1">
          <span class="text-muted small">{{ f.label }}</span>
          <span class="small fw-semibold">{{ displayValue(f) }}</span>
        </div>
      }
    }
  `,
})
export class CustomFieldsDisplayComponent implements OnChanges {
  private customFieldSvc = inject(CustomFieldService);

  @Input({ required: true }) entity!: CustomFieldEntity;
  @Input() values: Record<string, unknown> = {};

  fields = signal<CustomField[]>([]);

  ngOnChanges(): void {
    this.customFieldSvc.getForEntity(this.entity).subscribe((fields) => this.fields.set(fields));
  }

  displayValue(f: CustomField): string {
    let v = this.values[f.key];
    if (f.type === 'checkbox') return v ? 'Yes' : 'No';
    if (v === '' || v == null) return '—';
    return String(v);
  }
}
