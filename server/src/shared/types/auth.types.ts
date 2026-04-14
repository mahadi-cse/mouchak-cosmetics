export const USER_TYPE_CODES = {
  SYSTEM_ADMIN: '1x101',
  MANAGER: '4x404',
  SALES_STAFF: '5x505',
  CASHIER: '6x606',
  RIDER: '7x707',
  CUSTOMER: '9x909',
} as const;

export type RoleCode = (typeof USER_TYPE_CODES)[keyof typeof USER_TYPE_CODES];

export interface AccessTokenPayload {
  sub: string;
  role: RoleCode;
  typeId: number;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: number;
  email?: string;
  role: RoleCode;
  typeId: number;
  iat: number;
  exp: number;
}

export const STAFF_ROLE_CODES: RoleCode[] = [
  USER_TYPE_CODES.SYSTEM_ADMIN,
  USER_TYPE_CODES.MANAGER,
  USER_TYPE_CODES.SALES_STAFF,
  USER_TYPE_CODES.CASHIER,
  USER_TYPE_CODES.RIDER,
];

export const isRoleCode = (value: string): value is RoleCode => {
  return Object.values(USER_TYPE_CODES).includes(value as RoleCode);
};
