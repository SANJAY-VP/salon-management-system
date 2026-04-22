interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

export default function Card({ children, className = "", onClick, noPadding = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-surface border border-white/[0.08] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] rounded-2xl transition-all duration-500 hover:border-white/30 hover:shadow-gold/5 ${noPadding ? "" : "p-8"} ${
        onClick ? "cursor-pointer active:scale-[0.98]" : ""
      } ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.05),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
