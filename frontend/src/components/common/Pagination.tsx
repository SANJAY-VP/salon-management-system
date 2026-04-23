import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Generic page-number pagination bar.
 * Shows up to 5 page buttons centred around currentPage + Prev/Next arrows.
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build the window of up to 5 page numbers
  const delta = 2;
  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const btn = (
    page: number | "prev" | "next",
    label: React.ReactNode,
    disabled: boolean,
    active = false
  ) => (
    <button
      key={typeof page === "string" ? page : page}
      onClick={() => {
        if (disabled) return;
        if (page === "prev") onPageChange(currentPage - 1);
        else if (page === "next") onPageChange(currentPage + 1);
        else onPageChange(page);
      }}
      disabled={disabled}
      className={`min-w-[36px] h-9 px-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border ${
        active
          ? "bg-gold text-cocoa border-gold shadow-md"
          : disabled
          ? "text-white/30 border-white/5 cursor-not-allowed"
          : "text-white/50 border-white/10 hover:border-gold/40 hover:text-gold"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={`flex items-center justify-center gap-1.5 mt-8 ${className}`}>
      {btn("prev", "←", currentPage === 1)}
      {start > 1 && (
        <>
          {btn(1, "1", false, currentPage === 1)}
          {start > 2 && <span className="text-white/20 text-xs px-1">…</span>}
        </>
      )}
      {pages.map((p) => btn(p, p, false, p === currentPage))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-white/20 text-xs px-1">…</span>}
          {btn(totalPages, totalPages, false, currentPage === totalPages)}
        </>
      )}
      {btn("next", "→", currentPage === totalPages)}
    </div>
  );
}
