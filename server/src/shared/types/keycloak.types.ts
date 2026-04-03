import { UserRole } from '@prisma/client';

export interface KeycloakTokenPayload {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  realm_access: {
    roles: string[];
  };
  iat: number;
  exp: number;
  iss: string;
}

export interface AuthUser {
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  dbUserId?: string;
  iat: number;
  exp: number;
}
