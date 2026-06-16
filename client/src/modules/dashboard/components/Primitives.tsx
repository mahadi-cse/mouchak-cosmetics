import React from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { useDashboardLocale } from '../locales/DashboardLocaleContext';

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
  loading?: boolean;
  title?: string;
}

const Spinner = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ flexShrink: 0, animation: 'btn-spin 0.75s linear infinite' }}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <style>{`@keyframes btn-spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

export const Btn: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  title,
}) => {
  const isDisabled = disabled || loading;
  const baseClasses = `
    inline-flex items-center justify-center gap-1.5
    border-none rounded-lg font-semibold cursor-pointer transition-all duration-150
    ${size === 'sm' ? 'text-xs px-3.5 py-1.5' : 'text-sm px-5 py-2.5'}
    ${isDisabled ? 'opacity-55 cursor-not-allowed' : 'opacity-100'}
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
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {loading && <Spinner size={size === 'sm' ? 12 : 14} />}
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
}) => {
  const { t } = useDashboardLocale();
  return (
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
        {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% {t.kpi.vsLastMonth}
      </div>
    )}
    {sub && (
      <div className="text-xs text-muted-foreground mt-1">
        {sub}
      </div>
    )}
  </Card>
  );
};
