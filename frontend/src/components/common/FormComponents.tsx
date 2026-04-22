import { ReactNode } from "react";

interface FormProps {
  children: ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}

export function Form({ children, onSubmit, className = "" }: FormProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
      {children}
    </form>
  );
}

interface FormFieldProps {
  label?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function FormField({ label, error, htmlFor, children }: FormFieldProps) {
  return (
    <div className="mb-6 w-full">
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/60 mb-2 ml-1"
        >
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="text-red-400 font-bold text-[11px] uppercase tracking-widest mt-2 ml-1">
          {error}
        </p>
      )}
    </div>
  );
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function InputField({ label, error, icon, id, className = "", ...props }: InputFieldProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <FormField label={label} error={error} htmlFor={inputId}>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-white/[0.03] border border-white/[0.08] rounded-xl ${icon ? "pl-11" : "px-6"} pr-6 py-4 text-white text-sm font-medium placeholder:text-white/30 transition-all focus:outline-none focus:border-gold/50 focus:bg-white/[0.03] focus:ring-4 focus:ring-gold/[0.05] shadow-inner ${
            error ? "border-red-500/50 bg-red-500/[0.02]" : ""
          } ${className}`}
          {...props}
        />
        <div className="absolute inset-0 rounded-xl bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </FormField>
  );
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function SelectField({ label, error, options, id, className = "", ...props }: SelectFieldProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <FormField label={label} error={error} htmlFor={selectId}>
      <div className="relative group">
        <select
          id={selectId}
          className={`w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-6 py-4 text-white text-sm font-medium transition-all focus:outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/[0.05] appearance-none cursor-pointer shadow-inner ${
            error ? "border-red-500/50 bg-red-500/[0.02]" : ""
          } ${className}`}
          style={{ colorScheme: "dark" }}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{ background: "#111111", color: "#EAEAEA" }}
            >
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 5L7 10L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="absolute inset-0 rounded-xl bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </FormField>
  );
}

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextAreaField({ label, error, id, className = "", ...props }: TextAreaFieldProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <FormField label={label} error={error} htmlFor={textareaId}>
      <div className="relative group">
        <textarea
          id={textareaId}
          className={`w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-6 py-4 text-white text-sm font-medium placeholder:text-white/30 transition-all focus:outline-none focus:border-gold/50 focus:bg-white/[0.03] focus:ring-4 focus:ring-gold/[0.05] resize-none shadow-inner ${
            error ? "border-red-500/50 bg-red-500/[0.02]" : ""
          } ${className}`}
          {...props}
        />
        <div className="absolute inset-0 rounded-xl bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </FormField>
  );
}

interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export function CheckboxField({ label, helperText, id, className = "", ...props }: CheckboxFieldProps) {
  const checkId = id || (label ? `checkbox-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 relative flex-shrink-0">
        <input
          id={checkId}
          type="checkbox"
          className={`w-4 h-4 rounded border-white/20 bg-white/5 text-gold accent-gold focus:ring-gold/30 cursor-pointer ${className}`}
          {...props}
        />
      </div>
      {label && (
        <div>
          <label
            htmlFor={checkId}
            className="text-sm font-medium text-white/80 cursor-pointer select-none"
          >
            {label}
          </label>
          {helperText && (
            <p className="text-xs text-white/40 mt-0.5 font-medium">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
}
