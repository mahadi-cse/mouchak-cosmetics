// Design tokens
export const Theme = {
  primary: 'var(--primary, #f01172)',
  primaryDark: 'var(--primary-dark, #c20d5e)',
  bg: 'var(--background, #f5f5f5)',
  fg: 'var(--foreground, #212121)',
  card: 'var(--card, #ffffff)',
  muted: 'var(--muted, #f5f5f5)',
  mutedFg: 'var(--muted-foreground, #757575)',
  border: 'var(--border, #e0e0e0)',
  secondary: 'var(--secondary, #fff0f6)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export const formatCurrency = (amount: number) => {
  return `৳${Number(amount).toLocaleString('en-BD')}`;
};

export const statusStyles = {
  delivered: { bg: '#dcfce7', color: '#166534' },
  processing: { bg: '#fff7ed', color: '#9a3412' },
  shipped: { bg: '#dbeafe', color: '#1e40af' },
  pending: { bg: '#faf5ff', color: '#6b21a8' },
};

export const stockStatusStyle = (status: 'active' | 'low' | 'out') => {
  switch (status) {
    case 'out':
      return { bg: '#fee2e2', color: '#991b1b' };
    case 'low':
      return { bg: '#fef9c3', color: '#854d0e' };
    default:
      return { bg: '#dcfce7', color: '#166534' };
  }
};
