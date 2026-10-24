import React from 'react';
import { Play, Download, Sparkles, Navigation, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onWatchDemo: () => void;
  onDownloadDemo: () => void;
  onStartCustom: () => void;
  isDownloadingDemo?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onWatchDemo,
  onDownloadDemo,
  onStartCustom,
  isDownloadingDemo = false
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 md:py-16 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 border-b border-slate-200">
      {/* Subtle background ambient mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-r from-rose-200/30 via-amber-200/25 to-sky-200/20 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Unboxed editorial kicker */}
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 mb-3 tracking-wide">
              <span>Bangladesh Route Animator</span>
              <span aria-hidden="true">·</span>
              <span>Social Media Story & Reels Creator</span>
            </div>

            {/* Exact Required Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] text-balance">
              Your Journey. <br />
              <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 bg-clip-text text-transparent">
                Your Story.
              </span>
            </h1>

            {/* Exact Required Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Turn your travel route into a beautiful animated video in seconds.
              Select any locations across Bangladesh, trace real highways, and
              export viral-ready 9:16 story reels.
            </p>

            {/* Demo Highlight Banner */}
            <div className="mt-6 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                <span className="font-semibold text-slate-700">Natore</span>
                <span className="text-slate-400">➔</span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                <span className="font-semibold text-slate-700">Bandarban</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-slate-500">462 km Highway · 10s Reel · Car</span>
            </div>

            {/* Primary Action Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                onClick={onStartCustom}
                className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm shadow-md hover:shadow-rose-500/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Your Journey</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>

              <button
                onClick={onWatchDemo}
                className="py-3.5 px-5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 text-rose-600 fill-rose-600" />
                <span>Watch Demo</span>
              </button>

              <button
                onClick={onDownloadDemo}
                disabled={isDownloadingDemo}
                className="py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>{isDownloadingDemo ? 'Rendering...' : 'Download Demo'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual Journey Preview Banner Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-900 group">
              <img
                src="/src/assets/images/route_reel_hero_1792768442849.jpg"
                alt="Scenic highway journey in Bangladesh"
                referrerPolicy="no-referrer"
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
              />

              {/* Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Overlay Content */}
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <div className="flex items-center gap-2 text-[11px] font-bold text-amber-300 tracking-wider uppercase mb-1">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Cinematic Travel Reel Demo</span>
                </div>
                <div className="text-xl font-extrabold tracking-tight">
                  Natore ➔ Bandarban Hills
                </div>
                <div className="text-xs text-slate-300 mt-1 flex items-center justify-between">
                  <span>Bangabandhu Bridge · Dhaka · Chattogram · Bandarban</span>
                  <button
                    onClick={onWatchDemo}
                    className="ml-2 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Play
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
