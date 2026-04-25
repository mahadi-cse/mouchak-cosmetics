export interface Promotion {
  id: number;
  label: string;
  banner: string;
  pct: number;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
