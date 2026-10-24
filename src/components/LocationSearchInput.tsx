import React, { useState, useEffect, useRef } from 'react';
import { LocationPoint } from '../types/route';
import { searchLocations } from '../services/routingService';
import { Search, MapPin, X, Loader2 } from 'lucide-react';

interface LocationSearchInputProps {
  label: string;
  placeholder: string;
  value: LocationPoint | null;
  onChange: (location: LocationPoint) => void;
  accentColor?: string;
  quickPicks?: string[];
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  accentColor = 'text-rose-500',
  quickPicks = []
}) => {
  const [query, setQuery] = useState(value ? value.name : '');
  const [suggestions, setSuggestions] = useState<LocationPoint[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal input query when value prop changes externally (e.g., swap or demo)
  useEffect(() => {
    if (value) {
      setQuery(value.name);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchLocations(query);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, isOpen]);

  const handleSelect = (loc: LocationPoint) => {
    setQuery(loc.name);
    onChange(loc);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <MapPin className={`w-3.5 h-3.5 ${accentColor}`} />
          {label}
        </label>
        {value && (
          <span className="text-[11px] text-slate-500">
            {value.district}, {value.division}
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 pr-9 text-sm font-medium bg-white border border-slate-200 rounded-xl shadow-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
        />

        <div className="absolute right-2.5 flex items-center">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Search className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Quick Picks chips */}
      {quickPicks.length > 0 && !isOpen && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[10px] text-slate-400 font-medium">Popular:</span>
          {quickPicks.map(pick => (
            <button
              key={pick}
              type="button"
              onClick={async () => {
                const results = await searchLocations(pick);
                if (results[0]) handleSelect(results[0]);
              }}
              className="text-[11px] text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50/70 transition-colors"
            >
              {pick}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute z-40 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 py-1 divide-y divide-slate-100">
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-500 text-center">
              No matching locations found in Bangladesh
            </div>
          ) : (
            suggestions.map(loc => (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelect(loc)}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 group-hover:text-rose-600 flex items-center gap-2">
                    <span>{loc.name}</span>
                    {loc.bnName && (
                      <span className="text-xs text-slate-500 font-normal">
                        ({loc.bnName})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-[280px]">
                    {loc.description || `${loc.district}, ${loc.division}`}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {loc.district}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
