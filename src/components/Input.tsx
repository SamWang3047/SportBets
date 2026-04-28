import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function Input({ label, error, required, className = '', ...props }: InputProps) {
  const inputClasses = `input ${error ? 'input-error' : ''} ${className}`.trim();
  const labelClasses = `label ${required ? 'label-required' : ''}`;

  return (
    <div className="mb-4">
      {label && <label className={labelClasses}>{label}</label>}
      <input className={inputClasses} {...props} />
      {error && <p className="text-xs text-error mt-2">{error}</p>}
    </div>
  );
}
