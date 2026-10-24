/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  JourneyConfig,
  LocationPoint,
  RouteGeometry,
  VehicleType,
  VideoDuration,
  VideoFormat
} from './types/route';
import {
  BANGLADESH_LOCATIONS,
  DEMO_JOURNEY
} from './data/bangladeshLocations';
import { getRoute } from './services/routingService';
import { InteractiveRouteMap } from './components/InteractiveRouteMap';
import { JourneyForm } from './components/JourneyForm';
import { VideoExportModal } from './components/VideoExportModal';
import { ShareModal } from './components/ShareModal';
import {
  Compass,
  Play,
  Film,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Share2
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<JourneyConfig>({
    id: 'current-journey',
    title: DEMO_JOURNEY.title,
    subtitle: DEMO_JOURNEY.subtitle,
    startLocation: DEMO_JOURNEY.start,
    destination: DEMO_JOURNEY.destination,
    vehicle: 'car',
    duration: 10,
    format: '9:16',
    mapTheme: 'classic',
    routeColor: '#ef4444',
    showDistance: true,
    showSpeed: true,
    showMilestones: true,
    cameraMode: 'overview',
    createdAt: Date.now()
  });

  const [route, setRoute] = useState<RouteGeometry | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load shared URL parameters on initial mount (?start=...&dest=...&vehicle=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const startId = params.get('start');
    const destId = params.get('dest');
    const vehicleParam = params.get('vehicle') as VehicleType | null;
    const durationParam = params.get('duration');
    const themeParam = params.get('theme') as any;

    if (startId || destId || vehicleParam) {
      const start = BANGLADESH_LOCATIONS.find(
        l =>
          l.id.toLowerCase() === startId?.toLowerCase() ||
          l.name.toLowerCase() === startId?.toLowerCase()
      );
      const dest = BANGLADESH_LOCATIONS.find(
        l =>
          l.id.toLowerCase() === destId?.toLowerCase() ||
          l.name.toLowerCase() === destId?.toLowerCase()
      );

      setConfig(prev => ({
        ...prev,
        ...(start ? { startLocation: start } : {}),
        ...(dest
          ? { destination: dest, title: `Traveling to ${dest.name}` }
          : {}),
        ...(vehicleParam &&
        ['car', 'bus', 'train', 'motorcycle', 'airplane'].includes(vehicleParam)
          ? { vehicle: vehicleParam }
          : {}),
        ...(durationParam
          ? { duration: parseInt(durationParam) as 10 | 15 }
          : {}),
        ...(themeParam &&
        ['classic', 'dark', 'minimal', 'satellite'].includes(themeParam)
          ? { mapTheme: themeParam }
          : {})
      }));

      showToast('শেয়ার করা রুট লোড হয়েছে (Shared journey loaded)!');
    }
  }, []);

  // Fetch Route when locations change
  useEffect(() => {
    let isCancelled = false;

    async function loadRoute() {
      if (!config.startLocation || !config.destination) return;
      setIsLoadingRoute(true);

      try {
        const fetchedRoute = await getRoute(
          config.startLocation,
          config.destination,
          config.vehicle
        );
        if (!isCancelled) {
          setRoute(fetchedRoute);
          setProgress(0);
          setIsPlaying(false);
        }
      } catch (err) {
        console.error('Route error:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingRoute(false);
        }
      }
    }

    loadRoute();
    return () => {
      isCancelled = true;
    };
  }, [config.startLocation, config.destination, config.vehicle]);

  // RequestAnimationFrame Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const durationMs = config.duration * 1000;

    const step = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setProgress(prev => {
        const next = prev + delta / durationMs;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, config.duration]);

  const handleTogglePlay = () => {
    if (progress >= 1) {
      setProgress(0);
    }
    setIsPlaying(prev => !prev);
  };

  const handleSeek = (newProgress: number) => {
    setProgress(Math.max(0, Math.min(1, newProgress)));
  };

  const handleSwapLocations = () => {
    setConfig(prev => ({
      ...prev,
      startLocation: prev.destination,
      destination: prev.startLocation,
      title: `Traveling to ${prev.startLocation.name}`
    }));
    showToast(`দিক পরিবর্তন: ${config.destination.name} ➔ ${config.startLocation.name}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Clean Simple Header */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              Route<span className="text-rose-600">Reel</span>
            </span>
            <span className="hidden sm:inline text-xs text-slate-500 border-l border-slate-200 pl-2 ml-1">
              Bangladesh Travel Video Creator
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsShareModalOpen(true)}
              disabled={isLoadingRoute || !route}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Share</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              disabled={isLoadingRoute || !route}
              className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Export Video</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Studio Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Select Locations, Vehicle, Duration, Format */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <JourneyForm
              config={config}
              onChangeConfig={updates =>
                setConfig(prev => ({ ...prev, ...updates }))
              }
              route={route}
              isLoadingRoute={isLoadingRoute}
              onSwapLocations={handleSwapLocations}
              onSubmit={() => setIsExportModalOpen(true)}
            />
          </div>

          {/* Right Map: Real Interactive Map of Bangladesh */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {isLoadingRoute ? (
              <div className="w-full h-[520px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-8 text-center shadow-md">
                <RefreshCw className="w-7 h-7 text-rose-500 animate-spin mb-2" />
                <div className="text-sm font-bold text-white">
                  ম্যাপ এবং রুট লোড হচ্ছে...
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Connecting {config.startLocation.name} to {config.destination.name}
                </div>
              </div>
            ) : route ? (
              <InteractiveRouteMap
                config={config}
                route={route}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                progress={progress}
                onSeek={handleSeek}
                cameraMode={config.cameraMode}
                onToggleCameraMode={() =>
                  setConfig(prev => ({
                    ...prev,
                    cameraMode:
                      prev.cameraMode === 'follow' ? 'overview' : 'follow'
                  }))
                }
                onSelectLocation={(loc, type) => {
                  if (type === 'start') {
                    setConfig(prev => ({
                      ...prev,
                      startLocation: loc
                    }));
                    showToast(`শুরুর স্থান নির্বাচন: ${loc.name}`);
                  } else {
                    setConfig(prev => ({
                      ...prev,
                      destination: loc,
                      title: `Traveling to ${loc.name}`
                    }));
                    showToast(`গন্তব্য নির্বাচন: ${loc.name}`);
                  }
                }}
                onOpenShare={() => setIsShareModalOpen(true)}
                heightClass="h-[480px] sm:h-[540px]"
              />
            ) : null}

            {/* Quick summary below map */}
            <div className="flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-800">
                  {config.startLocation.name} ➔ {config.destination.name}
                </span>{' '}
                · {route?.distanceKm} km · {config.duration}s ·{' '}
                <span className="capitalize">{config.vehicle}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  disabled={isLoadingRoute || !route}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Share</span>
                </button>
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={isLoadingRoute || !route}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer disabled:opacity-50"
                >
                  Generate Video ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Minimal Quiet Footer */}
      <footer className="py-4 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        RouteReel · OpenStreetMap & Carto Cartography · Real Video Export
      </footer>

      {/* 4. Video Export & Download Modal */}
      {route && (
        <VideoExportModal
          key={`${config.startLocation.name}-${config.destination.name}-${config.vehicle}-${config.duration}-${config.format}`}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          config={config}
          route={route}
          onSaveProject={() => {}}
        />
      )}

      {/* 5. Social Share Modal */}
      {route && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          config={config}
          route={route}
        />
      )}
    </div>
  );
}
