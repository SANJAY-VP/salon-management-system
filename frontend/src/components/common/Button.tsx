interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  loadingText,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses = "relative overflow-hidden font-bold rounded-xl transition-all duration-300 focus:outline-none flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer";

  const variantClasses = {
    primary: "bg-gold text-background hover:bg-gold-light hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]",
    secondary: "bg-white/10 text-white border border-white/10 hover:bg-white/30 hover:border-gold/30",
    danger: "bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white",
    outline: "bg-transparent border border-white/30 text-white hover:border-gold hover:text-gold",
  };

  const sizeClasses = {
    sm: "py-2.5 text-xs px-6",
    md: "py-3.5 text-sm px-8",
    lg: "py-4 text-base px-12",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {loading && loadingText ? loadingText : props.children}
      </span>
      {variant === "primary" && !loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
      )}
    </button>
  );
}
