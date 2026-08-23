import { Address } from './address.model';
import { RoleId } from './role.model';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId: RoleId;
  isActive: boolean;
  addresses: Address[];
  createdAt: string;
}

/** What's kept in sessionStorage after login — never includes the password. */
export interface SessionUser {
  id: number;
  name: string;
  email: string;
  roleId: RoleId;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}
