export const enum RoleId {
  Admin = 1,
  Customer = 2,
}

export interface Role {
  id: RoleId;
  name: string;
}
