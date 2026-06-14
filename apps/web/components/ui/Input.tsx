'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils';

interface BaseProps {
  label?: string;
  error?: string;
  hint?: string;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;
type SelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode };

const fieldClasses =
  'w-full px-4 py-3 rounded-xl border border-ink-100 bg-white text-ink-900 placeholder:text-ink-300 transition-all duration-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-ink-700 mb-1.5">
          {label}
        </label>
      )}
      <input ref={ref} id={fieldId} className={cn(fieldClasses, error && 'border-semantic-danger focus:border-semantic-danger focus:ring-semantic-danger/20', className)} {...rest} />
      {error ? (
        <p className="text-xs text-semantic-danger mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500 mt-1">{hint}</p>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-ink-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea ref={ref} id={fieldId} className={cn(fieldClasses, 'min-h-[96px] resize-y', error && 'border-semantic-danger', className)} {...rest} />
      {error ? <p className="text-xs text-semantic-danger mt-1">{error}</p> : hint ? <p className="text-xs text-ink-500 mt-1">{hint}</p> : null}
    </div>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, id, children, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-ink-700 mb-1.5">
          {label}
        </label>
      )}
      <select ref={ref} id={fieldId} className={cn(fieldClasses, 'pr-10 appearance-none bg-no-repeat bg-right', error && 'border-semantic-danger', className)} {...rest}>
        {children}
      </select>
      {error ? <p className="text-xs text-semantic-danger mt-1">{error}</p> : hint ? <p className="text-xs text-ink-500 mt-1">{hint}</p> : null}
    </div>
  );
});
