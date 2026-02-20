import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="cursor-help"
      >
        {children}
      </span>
      {visible && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 text-xs p-3 rounded shadow-lg pointer-events-none"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
        >
          {content}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid var(--border)',
            }}
          />
        </div>
      )}
    </span>
  );
}
