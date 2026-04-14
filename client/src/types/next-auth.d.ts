import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id?: string;
      role?: string;
      typeId?: number;
    };
    accessToken?: string;
    error?: string;
  }

  interface User {
    role?: string;
    typeId?: number;
    accessToken?: string;
    accessTokenExpiresAt?: number;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    role?: string;
    typeId?: number;
    accessToken?: string;
    accessTokenExpiresAt?: number;
    refreshToken?: string;
    error?: string;
  }
}
