import React, { CSSProperties } from 'react';
import { Theme } from '../theme';

interface ComponentProps {
  children: React.ReactNode;
  style?: CSSProperties;
  className?: string;
}

interface CardProps extends ComponentProps {
  pad?: number;
}

export const Card: React.FC<CardProps> = ({ children, pad = 24, style }) => (
  <div
    style={{
      background: Theme.card,
      border: `1px solid ${Theme.border}`,
      borderRadius: 14,
      padding: pad,
      ...style,
    }}
  >
    {children}
  </div>
);

interface ButtonProps extends ComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  onClick?: () => void;
  disabled?: boolean;
}

export const Btn: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  style,
}) => {
  const baseStyle: CSSProperties = {
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'background 0.15s',
    fontSize: size === 'sm' ? 12 : 13,
    padding: size === 'sm' ? '6px 14px' : '10px 20px',
    ...style,
  };

  const variantStyles: Record<string, CSSProperties> = {
    primary: { background: Theme.primary, color: '#fff' },
    secondary: {
      background: '#fff',
      color: Theme.primary,
      border: `1px solid ${Theme.primary}`,
    },
    ghost: {
      background: 'transparent',
      color: Theme.mutedFg,
      border: `1px solid ${Theme.border}`,
    },
    danger: { background: Theme.danger, color: '#fff' },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variantStyles[variant] }}
    >
      {children}
    </button>
  );
};

interface BadgeProps {
  label: string;
  bg: string;
  color: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, bg, color }) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 600,
      padding: '3px 10px',
      borderRadius: 20,
      background: bg,
      color,
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </span>
);

interface SecHeadProps {
  title: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
}

export const SecHead: React.FC<SecHeadProps> = ({ title, sub, action, onAction }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 18,
    }}
  >
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: Theme.fg }}>
        {title}
      </div>
      {sub && <div style={{ fontSize: 12, color: Theme.mutedFg, marginTop: 2 }}>{sub}</div>}
    </div>
    {action && <Btn variant="ghost" size="sm" onClick={onAction}>{action}</Btn>}
  </div>
);

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number;
  sub?: string;
  icon: string;
  accent?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  delta,
  sub,
  icon,
  accent,
}) => (
  <Card
    style={{
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: -12,
        right: -12,
        width: 70,
        height: 70,
        background: accent || Theme.secondary,
        borderRadius: '50%',
        opacity: 0.7,
      }}
    />
    <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
    <div
      style={{
        fontSize: 24,
        fontWeight: 800,
        color: Theme.fg,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: 11,
        color: Theme.mutedFg,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        marginTop: 4,
      }}
    >
      {label}
    </div>
    {delta !== undefined && (
      <div
        style={{
          fontSize: 12,
          color: delta >= 0 ? Theme.success : Theme.danger,
          fontWeight: 600,
          marginTop: 4,
        }}
      >
        {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs last month
      </div>
    )}
    {sub && (
      <div style={{ fontSize: 12, color: Theme.mutedFg, marginTop: 4 }}>
        {sub}
      </div>
    )}
  </Card>
);
