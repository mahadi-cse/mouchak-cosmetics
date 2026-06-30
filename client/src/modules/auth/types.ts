export interface UserProfile {
  id: string | number;
  name: string;
  email?: string;
  avatarUrl?: string; // ready for image support
  role?: string;
  userType?: {
    code: string;
    name: string;
  };
}
