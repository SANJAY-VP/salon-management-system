import { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = "", id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id || (label ? generatedId : undefined);

  return (
    <div className="mb-6 w-full animate-fade-in">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/60 mb-3 ml-1 cursor-pointer"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          id={inputId}
          className={`w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-6 py-4 text-white text-sm font-medium placeholder:text-white/30 transition-all focus:outline-none focus:border-gold/50 focus:bg-white/[0.03] focus:ring-4 focus:ring-gold/[0.05] shadow-inner ${
            error ? "border-red-500/50 bg-red-500/[0.01]" : ""
          } ${className}`}
          {...props}
          onInput={(e) => {
            const input = e.target as HTMLInputElement;
            if (props.maxLength && input.value.length > props.maxLength) {
              input.value = input.value.slice(0, props.maxLength);
              const event = new Event("input", { bubbles: true });
              input.dispatchEvent(event);
            }
            if (props.onInput) props.onInput(e);
          }}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
        />
        <div className="absolute inset-0 rounded-xl bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
      {error && (
        <p
          id={inputId ? `${inputId}-error` : undefined}
          role="alert"
          className="text-red-400 font-bold text-[11px] uppercase tracking-widest mt-2 ml-1"
        >
          {error}
        </p>
      )}
    </div>
  );
}
