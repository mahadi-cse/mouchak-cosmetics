import React, { CSSProperties } from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';

export const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th
    style={{
      padding: '11px 16px',
      textAlign: 'left',
      fontSize: 11,
      fontWeight: 700,
      color: Theme.mutedFg,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      background: Theme.muted,
      whiteSpace: 'nowrap',
    } as CSSProperties}
  >
    {children}
  </th>
);

export const Td: React.FC<{
  children: React.ReactNode;
  style?: CSSProperties;
}> = ({ children, style }) => (
  <td
    style={{
      padding: '12px 16px',
      fontSize: 13,
      color: Theme.fg,
      borderBottom: `1px solid ${Theme.border}`,
      ...style,
    } as CSSProperties}
  >
    {children}
  </td>
);
