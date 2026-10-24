import React from 'react';
import { MapPin, Sliders, PlayCircle, Download, ShieldCheck } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Pick Bangladesh Locations',
      desc: 'Enter any starting city and destination across Bangladesh—from Natore, Dhaka, or Sylhet to Bandarban or Sajek Valley. Real road geometry is fetched automatically.',
      icon: <MapPin className="w-5 h-5 text-rose-500" />
    },
    {
      num: '02',
      title: 'Select Vehicle & Duration',
      desc: 'Choose between an animated Road Trip Car, Travel Coach Bus, or Adventure Motorbike. Set your reel duration to 10s or 15s and pick 9:16 portrait format.',
      icon: <Sliders className="w-5 h-5 text-amber-500" />
    },
    {
      num: '03',
      title: 'Preview Dynamic Journey',
      desc: 'Watch the vehicle steer along real national highways, complete with realistic heading rotation, river bridge crossings, and milestone alerts.',
      icon: <PlayCircle className="w-5 h-5 text-sky-500" />
    },
    {
      num: '04',
      title: 'Export & Share Reel',
      desc: 'Render a crisp social media video with title overlays and distance HUD. Download with one click and post directly to Instagram, WhatsApp, or Facebook.',
      icon: <Download className="w-5 h-5 text-emerald-500" />
    }
  ];

  return (
    <section id="how-it-works" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2">
            Simple 4-Step Process
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How RouteReel Works
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            From search to cinematic travel reel in under a minute without screen
            recording or editing software.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(step => (
            <div
              key={step.num}
              className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-xl font-extrabold text-slate-300 font-mono">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Data & Attribution Banner */}
        <div className="mt-12 p-4 rounded-2xl bg-slate-100/70 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Powered by OpenStreetMap geodata, Carto vector cartography & OSRM
              road routing engines. Free and open-source infrastructure.
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            © OpenStreetMap contributors · OSRM
          </div>
        </div>
      </div>
    </section>
  );
};
