export const USER_TYPE_CODES = {
  SYSTEM_ADMIN: '1x101',
  MANAGER: '4x404',
  SALES_STAFF: '5x505',
  CASHIER: '6x606',
  RIDER: '7x707',
} as const;

export type UserTypeCode = (typeof USER_TYPE_CODES)[keyof typeof USER_TYPE_CODES];

export const STAFF_ROLE_CODES: UserTypeCode[] = [
  USER_TYPE_CODES.SYSTEM_ADMIN,
  USER_TYPE_CODES.MANAGER,
  USER_TYPE_CODES.SALES_STAFF,
  USER_TYPE_CODES.CASHIER,
  USER_TYPE_CODES.RIDER,
];

export const isStaffRole = (role?: string | null): role is UserTypeCode => {
  return !!role && STAFF_ROLE_CODES.includes(role as UserTypeCode);
};
