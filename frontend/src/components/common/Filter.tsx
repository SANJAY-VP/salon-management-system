import React from "react";
import { Icon } from "./Icon";
import { SearchFilters } from "../../types";

interface FilterProps {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  onReset: () => void;
}

const Filter = ({ filters, setFilters, onReset }: FilterProps) => {
  const getGradient = (val: number, min: number, max: number) => {
    const percentage = ((val - min) / (max - min)) * 100;
    return `linear-gradient(to right, #D4AF37 ${percentage}%, rgba(255,255,255,0.05) ${percentage}%)`;
  };

  return (
    <div className="space-y-8 py-4">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Icon icon="filter" size={18} className="text-gold" />
          Filter Options
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-white/60 hover:text-gold transition-all"
        >
          Reset
        </button>
      </div>

      <div className="space-y-8 px-2">
        <div className="space-y-4">
          <div className="flex justify-between items-center font-medium">
            <span className="text-sm text-white/60">Minimum Rating</span>
            <span className="text-white bg-gold/10 px-2 py-1 rounded text-sm">{filters.rating.toFixed(1)} ★</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={filters.rating}
            onChange={(e) => setFilters({ ...filters, rating: parseFloat(e.target.value) })}
            className="w-full accent-gold h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{ background: getGradient(filters.rating, 0, 5) }}
          />
        </div>

        {/* Price Filter */}
        <div className="space-y-4">
          <div className="flex justify-between items-center font-medium">
            <span className="text-sm text-white/60">Max Price (₹)</span>
            <span className="text-white bg-gold/10 px-2 py-1 rounded text-sm">₹{filters.priceMax}</span>
          </div>
          <input
            type="range"
            min="0"
            max="5000"
            step="100"
            value={filters.priceMax}
            onChange={(e) => setFilters({ ...filters, priceMax: parseInt(e.target.value) })}
            className="w-full accent-gold h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{ background: getGradient(filters.priceMax, 0, 5000) }}
          />
        </div>

        {/* Distance Filter */}
        <div className="space-y-4">
          <div className="flex justify-between items-center font-medium">
            <span className="text-sm text-white/60">Distance (KM)</span>
            <span className="text-white bg-gold/10 px-2 py-1 rounded text-sm">{filters.distance} km</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={filters.distance}
            onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })}
            className="w-full accent-gold h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{ background: getGradient(filters.distance, 1, 50) }}
          />
        </div>

        {/* Open Now Toggle */}
        <div
          className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
          onClick={() => setFilters({ ...filters, openNow: !filters.openNow })}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full transition-all ${filters.openNow ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]' : 'bg-white/30'}`} />
            <span className="text-sm text-white font-bold opacity-80">Currently Open Only</span>
          </div>
          <div
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${filters.openNow ? 'bg-emerald-500' : 'bg-white/10'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300 ${filters.openNow ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filter;

