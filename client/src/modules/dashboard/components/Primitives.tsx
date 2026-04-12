import React from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';

interface ComponentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardProps extends ComponentProps {
  pad?: number;
}

export const Card: React.FC<CardProps> = ({ children, pad = 6, className = '' }) => (
  <div className={`bg-card border border-border rounded-[14px] p-${pad} ${className}`}>
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
  className = '',
}) => {
  const baseClasses = `
    border-none rounded-lg font-semibold cursor-pointer transition-all duration-150
    ${size === 'sm' ? 'text-xs px-3.5 py-1.5' : 'text-sm px-5 py-2.5'}
    ${disabled ? 'opacity-45 cursor-not-allowed' : 'opacity-100'}
    ${className}
  `;

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-opacity-90',
    secondary: 'bg-white border border-primary text-primary hover:bg-opacity-95',
    ghost: 'bg-transparent text-muted-foreground border border-border hover:bg-muted',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
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
  <span className={`text-xs font-semibold px-2.5 py-0.75 rounded-full whitespace-nowrap`} style={{ backgroundColor: bg, color }}>
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
  <div className="flex items-start justify-between mb-5">
    <div>
      <div className="text-base font-bold text-foreground">
        {title}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
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
  <Card className="relative overflow-hidden">
    <div
      className="absolute -top-3 -right-3 w-[70px] h-[70px] rounded-full opacity-70"
      style={{ backgroundColor: accent || Theme.secondary }}
    />
    <div className="text-2xl mb-1.5">{icon}</div>
    <div className="text-2xl font-black text-foreground tracking-tighter leading-none">
      {value}
    </div>
    <div className="text-xs text-muted-foreground font-semibold tracking-widest uppercase mt-1">
      {label}
    </div>
    {delta !== undefined && (
      <div
        className={`text-sm font-semibold mt-1 ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}
      >
        {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs last month
      </div>
    )}
    {sub && (
      <div className="text-xs text-muted-foreground mt-1">
        {sub}
      </div>
    )}
  </Card>
);
