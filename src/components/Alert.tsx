import React from 'react';

interface AlertProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function Alert({ variant = 'info', children, className = '', onClose }: AlertProps) {
  return (
    <div className={`alert alert-${variant} ${className}`.trim()}>
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-current opacity-50 hover:opacity-100"
          aria-label="Close"
        >
          ×
        </button>
      )}
    </div>
  );
}
