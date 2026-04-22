import React, { ReactNode } from "react";
import Card from "./Card";
import { Icon, IconKey } from "./Icon";

interface StatCardProps {
  title?: string;
  label?: string; // alias for title
  value: string | number;
  subtitle?: string;
  icon?: IconKey | ReactNode;
  color?: 'gold' | 'emerald' | 'indigo' | 'yellow' | 'red' | 'blue' | 'purple' | 'bronze' | 'cream' | 'cocoa';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatCard = ({
  title,
  label,
  value,
  subtitle,
  icon,
  color = 'gold',
  size = 'md',
  className = ""
}: StatCardProps) => {
  const displayTitle = title || label || "Metric";

  const colorClasses: Record<string, string> = {
    gold: 'text-gold',
    emerald: 'text-emerald-400',
    indigo: 'text-indigo-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    bronze: 'text-gold-dark',
    cream: 'text-silver',
    cocoa: 'text-background'
  };

  const sizeClasses = {
    sm: 'p-6',
    md: 'p-8',
    lg: 'p-10'
  };

  const valueSizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl'
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return (
        <div className={`w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6 group-hover:border-gold/30 transition-all duration-500`}>
          <Icon 
            icon={icon as IconKey} 
            size={20} 
            className={`${colorClasses[color] || 'text-gold'}`} 
          />
        </div>
      );
    }
    return (
      <div className={`w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-6 border-white/[0.05] group-hover:border-gold/30 transition-all duration-500 text-xl ${colorClasses[color] || 'text-gold'}`}>
        {icon}
      </div>
    );
  };

  return (
    <Card className={`${sizeClasses[size]} group ${className} relative overflow-hidden`} noPadding>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-gold/10 transition-all duration-1000" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          {renderIcon()}
          {subtitle && (
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 bg-white/[0.02] px-3 py-1 rounded-full border border-white/[0.03]">
              {subtitle}
            </span>
          )}
        </div>
        
        <div className={`${valueSizeClasses[size]} font-black text-white mb-2 tracking-tighter leading-none`}>
          {typeof value === 'number' ? 
            (displayTitle.toLowerCase().includes('revenue') || displayTitle.toLowerCase().includes('earnings') ? 
              `₹${value.toLocaleString()}` : 
              value.toLocaleString()
            ) : 
            value
          }
        </div>
        <p className="text-[11px] text-white/50 uppercase font-black tracking-[0.25em]">{displayTitle}</p>
      </div>
    </Card>
  );
};
