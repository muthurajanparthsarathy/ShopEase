export interface Address {
  id: number;
  label: string;
  line: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, 'id' | 'isDefault'>;
