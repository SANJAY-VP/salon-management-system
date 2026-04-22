import React, { ReactNode } from "react";
import Card from "./Card";
import { Icon, IconKey } from "./Icon";

interface SleekStatCardProps {
  label: string;
  value: string | number;
  icon: IconKey | ReactNode;
  color?: string;
  description?: string;
  className?: string;
}

export const SleekStatCard = ({
  label,
  value,
  icon,
  color = "gold",
  description,
  className = ""
}: SleekStatCardProps) => {
  return (
    <div className={`group relative ${className}`}>
      <div className="absolute inset-0 bg-gold/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <Card className="p-10 bg-white/[0.02] border-white/5 rounded-[32px] hover:border-white/30 transition-all duration-700 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-10">
          <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-${color}`}>
            {typeof icon === "string" ? <Icon icon={icon as IconKey} size={20} /> : icon}
          </div>
          {description && (
            <div className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] bg-white/5 px-3 py-1.5 rounded-full border border-white/5 italic">
              {description}
            </div>
          )}
        </div>
        <h4 className="text-4xl font-bold font-serif text-white tabular-nums mb-3 tracking-tighter">
          {typeof value === "number" && value < 10 ? `0${value}` : value}
        </h4>
        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] leading-none">
          {label}
        </p>
      </Card>
    </div>
  );
};
