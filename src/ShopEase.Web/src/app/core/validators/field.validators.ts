import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MESSAGES, PATTERNS } from './patterns';

export type FieldName = keyof typeof PATTERNS;

/** Reactive Forms validator for one of the named patterns in PATTERNS — sets a `{ pattern: { message } }` error. */
export function fieldPattern(field: FieldName): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null; // let `required` own emptiness
    const clean = field === 'creditCard' ? String(value).replace(/[\s-]/g, '') : String(value).trim();
    return PATTERNS[field].test(clean) ? null : { pattern: { message: MESSAGES[field] } };
  };
}

/** Cross-field match validator (e.g. confirm password) — apply on the group, reads two control names. */
export function fieldsMatch(controlName: string, matchingControlName: string, message = 'Values do not match'): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const control = group.get(controlName);
    const match = group.get(matchingControlName);
    if (!control || !match) return null;
    if (match.value && control.value !== match.value) {
      match.setErrors({ ...(match.errors || {}), mismatch: { message } });
    } else if (match.errors) {
      const { mismatch, ...rest } = match.errors;
      match.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  };
}

/** Reads the first validation message off a control for display under a field, Bootstrap-invalid-feedback style. */
export function firstErrorMessage(control: AbstractControl | null): string {
  if (!control || !control.errors) return '';
  const errors = control.errors;
  if (errors['required']) return 'This field is required';
  if (errors['pattern']?.message) return errors['pattern'].message;
  if (errors['mismatch']?.message) return errors['mismatch'].message;
  if (errors['min']) return `Must be at least ${errors['min'].min}`;
  if (errors['max']) return `Must be at most ${errors['max'].max}`;
  if (errors['skuTaken']) return 'A product with this SKU already exists.';
  if (errors['emailTaken']) return 'An account with this email already exists.';
  if (errors['nameTaken']) return 'A category with this name already exists.';
  return 'Invalid value';
}
