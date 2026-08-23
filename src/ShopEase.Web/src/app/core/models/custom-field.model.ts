export type CustomFieldType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox';
export type CustomFieldEntity = 'order' | 'product' | 'customer' | 'category';

export interface CustomField {
  id: number;
  key: string;
  label: string;
  entity: CustomFieldEntity;
  type: CustomFieldType;
  options: string[];
  required: boolean;
  active: boolean;
  createdAt: string;
}

export type CustomFieldInput = Omit<CustomField, 'id' | 'key' | 'createdAt'>;
