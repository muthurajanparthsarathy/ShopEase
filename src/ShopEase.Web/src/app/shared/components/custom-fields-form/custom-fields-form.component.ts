import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomFieldService } from '../../../core/services/custom-field.service';
import { CustomField, CustomFieldEntity } from '../../../core/models';

export interface CustomFieldsResult {
  values: Record<string, unknown>;
  errors: string[];
}

/** Renders the dynamic Add/Edit inputs for one entity's active custom fields — reused by every admin form (products/orders/customers/categories). */
@Component({
  selector: 'app-custom-fields-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (fields().length) {
      <hr>
      <h6 class="fw-bold"><i class="bi bi-ui-checks-grid text-primary"></i> Additional Details</h6>
      <div class="row g-3">
        @for (f of fields(); track f.id) {
          <div class="col-md-6">
            <label class="form-label">{{ f.label }} @if (f.required) { <span class="text-danger">*</span> }</label>
            @switch (f.type) {
              @case ('checkbox') {
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" [id]="'cf-' + f.key" [ngModel]="values()[f.key]" (ngModelChange)="setValue(f.key, $event)">
                  <label class="form-check-label" [for]="'cf-' + f.key">Yes</label>
                </div>
              }
              @case ('dropdown') {
                <select class="form-select" [ngModel]="values()[f.key]" (ngModelChange)="setValue(f.key, $event)">
                  <option value="">Select...</option>
                  @for (o of f.options; track o) { <option [value]="o">{{ o }}</option> }
                </select>
              }
              @default {
                <input [type]="f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'" class="form-control"
                       [ngModel]="values()[f.key]" (ngModelChange)="setValue(f.key, $event)">
              }
            }
          </div>
        }
      </div>
    }
  `,
})
export class CustomFieldsFormComponent implements OnChanges {
  private customFieldSvc = inject(CustomFieldService);

  @Input({ required: true }) entity!: CustomFieldEntity;
  @Input() initialValues: Record<string, unknown> = {};

  fields = signal<CustomField[]>([]);
  values = signal<Record<string, unknown>>({});

  ngOnChanges(): void {
    this.values.set({ ...this.initialValues });
    this.customFieldSvc.getForEntity(this.entity).subscribe((fields) => this.fields.set(fields));
  }

  setValue(key: string, value: unknown): void {
    this.values.update((v) => ({ ...v, [key]: value }));
  }

  getResult(): CustomFieldsResult {
    const errors: string[] = [];
    const values = this.values();
    this.fields().forEach((f) => {
      const val = values[f.key];
      if (f.required && (val === '' || val === false || val == null)) errors.push(f.label);
    });
    return { values, errors };
  }
}
