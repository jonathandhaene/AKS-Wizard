import React from 'react';

interface InfoBoxProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'success' | 'tip';
}

const VARIANTS = {
  info: { icon: 'ℹ️', colorVar: 'var(--info)' },
  warning: { icon: '⚠️', colorVar: 'var(--warning)' },
  success: { icon: '✅', colorVar: 'var(--success)' },
  tip: { icon: '💡', colorVar: 'var(--accent)' },
};

export function InfoBox({ title, children, variant = 'info' }: InfoBoxProps) {
  const v = VARIANTS[variant];
  return (
    <div
      className="p-4 rounded my-4 text-sm"
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${v.colorVar}`,
        borderRadius: 'var(--radius)',
        borderLeft: `4px solid ${v.colorVar}`,
      }}
    >
      {title && (
        <div className="font-semibold mb-1" style={{ color: v.colorVar }}>
          {v.icon} {title}
        </div>
      )}
      <div style={{ color: 'var(--text-secondary)' }}>{children}</div>
    </div>
  );
}
