import React, { useState, useEffect, useRef } from 'react';
import {
  JourneyConfig,
  RouteGeometry,
  VideoFormat
} from '../types/route';
import {
  renderJourneyVideo,
  RenderResult,
  getVideoDimensions
} from '../services/canvasVideoRenderer';
import {
  X,
  Download,
  Share2,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Film,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Monitor,
  Square,
  Clock,
  Compass
} from 'lucide-react';

interface VideoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: JourneyConfig;
  route: RouteGeometry;
  onSaveProject: (result: RenderResult) => void;
}

export const VideoExportModal: React.FC<VideoExportModalProps> = ({
  isOpen,
  onClose,
  config,
  route,
  onSaveProject
}) => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState('');
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showStoryMockup, setShowStoryMockup] = useState(true);

  const videoElementRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Track the exact journey key that was rendered
  const journeyKey = `${config.startLocation.name}->${config.destination.name}-${config.vehicle}-${config.duration}-${config.format}`;
  const lastRenderedKeyRef = useRef<string>('');

  // Always generate a fresh video when modal opens or when route/locations change
  useEffect(() => {
    if (isOpen) {
      if (lastRenderedKeyRef.current !== journeyKey || !renderResult) {
        lastRenderedKeyRef.current = journeyKey;
        setRenderResult(null);
        startVideoExport();
      }
    }
  }, [isOpen, journeyKey]);

  const startVideoExport = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderStatus('Initializing canvas video engine...');
    setRenderError(null);

    try {
      const result = await renderJourneyVideo(config, route, (pct, status) => {
        setRenderProgress(pct);
        setRenderStatus(status);
      });

      setRenderResult(result);
      onSaveProject(result);
    } catch (err: any) {
      console.error('Video rendering error:', err);
      setRenderError(
        err?.message ||
          'Failed to compile video. Please verify media capabilities and try again.'
      );
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownload = () => {
    if (!renderResult) return;
    const a = document.createElement('a');
    a.href = renderResult.videoUrl;
    a.download = renderResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleTogglePlayVideo = () => {
    if (!videoElementRef.current) return;
    if (videoElementRef.current.paused) {
      videoElementRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoElementRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  if (!isOpen) return null;

  const { width, height } = getVideoDimensions(config.format);
  const aspectClass =
    config.format === '9:16'
      ? 'aspect-[9/16] max-w-[340px]'
      : config.format === '16:9'
      ? 'aspect-[16/9] max-w-[620px]'
      : 'aspect-square max-w-[420px]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Cinematic Route Export
              </h2>
              <p className="text-xs text-slate-500">
                {config.startLocation.name} ➔ {config.destination.name} ·{' '}
                {config.duration}s · {config.format}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Phone Frame Preview or Player */}
          <div className="md:col-span-6 flex flex-col items-center justify-center">
            {isRendering ? (
              /* Rendering Progress Animation */
              <div
                className={`w-full ${aspectClass} rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden`}
              >
                {/* Ambient glow */}
                <div className="absolute inset-0 bg-radial from-rose-500/20 via-transparent to-transparent animate-pulse" />

                <div className="relative z-10 w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-500 mb-4 shadow-xl">
                  <Film className="w-8 h-8 animate-bounce" />
                </div>

                <div className="relative z-10 text-sm font-bold text-white mb-1">
                  Encoding Your Travel Story
                </div>
                <div className="relative z-10 text-xs text-slate-400 max-w-xs mb-4">
                  {renderStatus || 'Generating frame sequences...'}
                </div>

                {/* Progress bar */}
                <div className="relative z-10 w-full max-w-xs h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-200"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>

                <div className="relative z-10 text-xs font-mono tabular-nums text-slate-300 mt-2 font-bold">
                  {renderProgress}% Completed
                </div>
              </div>
            ) : renderResult ? (
              /* Finished Video Player in Phone / Frame */
              <div className="flex flex-col items-center w-full">
                <div
                  className={`relative w-full ${aspectClass} rounded-3xl bg-black overflow-hidden shadow-2xl border-4 border-slate-800 group`}
                >
                  <video
                    ref={videoElementRef}
                    src={renderResult.videoUrl}
                    playsInline
                    loop
                    autoPlay
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    className="w-full h-full object-cover"
                  />

                  {/* Play/Pause Overlay Button */}
                  <button
                    onClick={handleTogglePlayVideo}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-14 h-14 rounded-full bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                      {isVideoPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-1" />
                      )}
                    </div>
                  </button>

                  {/* Mobile Story Notch & UI Mockup (Optional toggle) */}
                  {showStoryMockup && config.format === '9:16' && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
                      {/* Instagram/TikTok style top bar */}
                      <div className="flex items-center justify-between text-white drop-shadow-md">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-rose-600 border border-white flex items-center justify-center text-[10px] font-bold">
                            RR
                          </div>
                          <span className="text-xs font-bold">routereel.story</span>
                          <span className="text-[10px] text-white/70">now</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub-controls */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleTogglePlayVideo}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    {isVideoPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Play
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (videoElementRef.current) {
                        videoElementRef.current.currentTime = 0;
                        videoElementRef.current.play();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Replay
                  </button>
                </div>
              </div>
            ) : renderError ? (
              /* Error State */
              <div className="w-full aspect-[9/16] max-w-[320px] rounded-2xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
                <div className="text-sm font-bold text-rose-900 mb-1">
                  Export Interrupted
                </div>
                <div className="text-xs text-rose-700 mb-4">{renderError}</div>
                <button
                  onClick={startVideoExport}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition-colors shadow-sm"
                >
                  Retry Video Render
                </button>
              </div>
            ) : null}
          </div>

          {/* Right Column: Download & Metadata Details */}
          <div className="md:col-span-6 flex flex-col gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready to Share & Download
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {config.title || `Traveling to ${config.destination.name}`}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Optimized video ready for Instagram Reels, Facebook Stories,
                WhatsApp Status, and TikTok.
              </p>
            </div>

            {/* Video Technical Specs Table */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 divide-y divide-slate-200/60 text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 font-medium">Route Path</span>
                <span className="font-bold text-slate-900">
                  {config.startLocation.name} ➔ {config.destination.name}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 font-medium">Road Distance</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {route.distanceKm} km
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 font-medium">Resolution</span>
                <span className="font-bold text-slate-900 font-mono">
                  {width} × {height} px ({config.format})
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 font-medium">Duration</span>
                <span className="font-bold text-slate-900">
                  {config.duration} Seconds (30 FPS)
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 font-medium">Vehicle</span>
                <span className="font-bold text-slate-900 capitalize">
                  {config.vehicle}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 font-medium">File Format</span>
                <span className="font-bold text-slate-900 uppercase font-mono">
                  {renderResult
                    ? renderResult.filename.split('.').pop()
                    : 'MP4 / WebM'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={handleDownload}
                disabled={!renderResult || isRendering}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-sm shadow-xl hover:shadow-rose-500/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                <span>Download Video File</span>
              </button>

              <button
                type="button"
                onClick={startVideoExport}
                disabled={isRendering}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-render Video</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
