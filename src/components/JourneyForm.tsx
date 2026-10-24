import React from 'react';
import {
  JourneyConfig,
  RouteGeometry,
  VehicleType,
  VideoDuration,
  VideoFormat,
  MapTheme
} from '../types/route';
import { LocationSearchInput } from './LocationSearchInput';
import { CarIcon, BusIcon, TrainIcon, MotorcycleIcon, AirplaneIcon } from '../utils/vehicleIcons';
import {
  ArrowUpDown,
  Sparkles,
  Layers,
  Palette,
  Check,
  Film,
  Navigation
} from 'lucide-react';

interface JourneyFormProps {
  config: JourneyConfig;
  onChangeConfig: (updates: Partial<JourneyConfig>) => void;
  route: RouteGeometry | null;
  isLoadingRoute: boolean;
  onSwapLocations: () => void;
  onSubmit: () => void;
}

const ROUTE_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Gold', hex: '#eab308' },
  { name: 'Pink', hex: '#ec4899' }
];

export const JourneyForm: React.FC<JourneyFormProps> = ({
  config,
  onChangeConfig,
  route,
  isLoadingRoute,
  onSwapLocations,
  onSubmit
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 flex flex-col gap-5">
      {/* 1. Location Inputs */}
      <div className="flex flex-col gap-2.5 relative">
        <LocationSearchInput
          label="শুরুর লোকেশন (Starting Location)"
          placeholder="e.g. Natore, Bangladesh"
          value={config.startLocation}
          onChange={loc => onChangeConfig({ startLocation: loc })}
          accentColor="text-emerald-500"
          quickPicks={['Natore', 'Dhaka', 'Rajshahi', 'Chittagong']}
        />

        {/* Swap Button */}
        <div className="flex items-center justify-center my-0.5">
          <button
            type="button"
            onClick={onSwapLocations}
            title="Swap Locations"
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-full border border-slate-200 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>দিক পরিবর্তন (Swap)</span>
          </button>
        </div>

        <LocationSearchInput
          label="গন্তব্য (Destination)"
          placeholder="e.g. Bandarban, Bangladesh"
          value={config.destination}
          onChange={loc =>
            onChangeConfig({
              destination: loc,
              title: `Traveling to ${loc.name}`
            })
          }
          accentColor="text-rose-500"
          quickPicks={['Bandarban', "Cox's Bazar", 'Sajek Valley', 'Sreemangal']}
        />
      </div>

      {/* 2. Route distance quick indicator */}
      {route && (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Navigation className="w-4 h-4 text-rose-500" />
            <span>
              {config.startLocation.name} ➔ {config.destination.name}
            </span>
          </div>
          <span className="font-bold text-slate-900 tabular-nums">
            {isLoadingRoute ? '...' : `${route.distanceKm} km`}
          </span>
        </div>
      )}

      {/* 3. Vehicle Selection (Car, Bus, Train, Bike, Airplane) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            যানবাহন নির্বাচন (Select Vehicle)
          </label>
          <span className="text-[11px] text-rose-600 font-semibold">
            ৫টি মোড (কার, বাস, ট্রেন, বাইক, এরোপ্লেন)
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[
            {
              type: 'car' as VehicleType,
              name: 'Car / কার',
              icon: <CarIcon className="w-8 h-4.5" />
            },
            {
              type: 'bus' as VehicleType,
              name: 'Bus / বাস',
              icon: <BusIcon className="w-9 h-4.5" />
            },
            {
              type: 'train' as VehicleType,
              name: 'Train / ট্রেন',
              subtitle: '৩ বগি',
              icon: <TrainIcon className="w-12 h-4.5" />
            },
            {
              type: 'motorcycle' as VehicleType,
              name: 'Bike / বাইক',
              icon: <MotorcycleIcon className="w-7 h-4.5" />
            },
            {
              type: 'airplane' as VehicleType,
              name: 'এরোপ্লেন',
              subtitle: 'বিমান',
              icon: <AirplaneIcon className="w-7 h-5" />
            }
          ].map(item => {
            const isSelected = config.vehicle === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => onChangeConfig({ vehicle: item.type })}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500 text-rose-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="h-6 flex items-center justify-center mb-1">
                  {item.icon}
                </div>
                <span className="text-[11px] leading-tight text-center font-bold">{item.name}</span>
                {item.subtitle && (
                  <span className="text-[9px] text-slate-500 font-medium leading-none mt-0.5">
                    {item.subtitle}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Video Duration (10s or 15s) */}
      <div>
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          ভিডিওর সময় (Duration)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { sec: 10 as VideoDuration, label: '১০ সেকেন্ড (10s)' },
            { sec: 15 as VideoDuration, label: '১৫ সেকেন্ড (15s)' }
          ].map(item => {
            const isSelected = config.duration === item.sec;
            return (
              <button
                key={item.sec}
                type="button"
                onClick={() => onChangeConfig({ duration: item.sec })}
                className={`py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/70 text-rose-700 ring-1 ring-rose-500'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-rose-500 text-white' : 'border border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Video Format */}
      <div>
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          ভিডিও ফরম্যাট (Format)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { format: '9:16' as VideoFormat, label: 'Story (9:16)' },
            { format: '16:9' as VideoFormat, label: 'Landscape (16:9)' },
            { format: '1:1' as VideoFormat, label: 'Square (1:1)' }
          ].map(fmt => {
            const isSelected = config.format === fmt.format;
            return (
              <button
                key={fmt.format}
                type="button"
                onClick={() => onChangeConfig({ format: fmt.format })}
                className={`py-2 px-2 rounded-xl border text-center text-xs transition-all ${
                  isSelected
                    ? 'border-rose-500 bg-rose-500 text-white font-bold shadow-xs'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Theme and Route Color */}
      <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
        {/* Map Theme */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            ম্যাপ থিম (Map Theme)
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'classic' as MapTheme, name: 'Topo 3D' },
              { id: 'satellite' as MapTheme, name: 'Satellite' },
              { id: 'dark' as MapTheme, name: 'Dark' },
              { id: 'minimal' as MapTheme, name: 'Clean' }
            ].map(th => (
              <button
                key={th.id}
                type="button"
                onClick={() => onChangeConfig({ mapTheme: th.id })}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                  config.mapTheme === th.id
                    ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {th.name}
              </button>
            ))}
          </div>
        </div>

        {/* Route Color */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-slate-500" />
            রুটের রঙ (Route Color)
          </label>
          <div className="flex items-center gap-2">
            {ROUTE_COLORS.map(c => (
              <button
                key={c.hex}
                type="button"
                onClick={() => onChangeConfig({ routeColor: c.hex })}
                title={c.name}
                className={`w-7 h-7 rounded-full transition-transform ${
                  config.routeColor === c.hex
                    ? 'scale-125 ring-2 ring-offset-2 ring-slate-800'
                    : 'hover:scale-110 opacity-80'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 7. Generate Video Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isLoadingRoute || !config.startLocation || !config.destination}
        className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-md hover:shadow-rose-500/25 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        <Film className="w-4 h-4" />
        <span>Generate Travel Video (ভিডিও তৈরি করুন)</span>
      </button>
    </div>
  );
};
