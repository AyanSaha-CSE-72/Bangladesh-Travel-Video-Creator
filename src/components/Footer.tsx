import React from 'react';
import { Compass, Heart } from 'lucide-react';

interface FooterProps {
  onQuickRoute: (start: string, dest: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onQuickRoute }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-white font-extrabold text-base mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <span>Route<span className="text-rose-500">Reel</span></span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Turn any road journey in Bangladesh into an eye-catching, animated
              social media story video in 10 or 15 seconds.
            </p>
          </div>

          {/* Popular BD Routes */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Popular Journeys
            </h4>
            <ul className="flex flex-col gap-2">
              <li>
                <button
                  onClick={() => onQuickRoute('natore', 'bandarban')}
                  className="hover:text-white transition-colors text-left"
                >
                  Natore ➔ Bandarban (Official Demo)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onQuickRoute('dhaka', 'coxs-bazar')}
                  className="hover:text-white transition-colors text-left"
                >
                  Dhaka ➔ Cox's Bazar Marine Drive
                </button>
              </li>
              <li>
                <button
                  onClick={() => onQuickRoute('chittagong', 'sajek-valley')}
                  className="hover:text-white transition-colors text-left"
                >
                  Chattogram ➔ Sajek Valley
                </button>
              </li>
              <li>
                <button
                  onClick={() => onQuickRoute('dhaka', 'sreemangal')}
                  className="hover:text-white transition-colors text-left"
                >
                  Dhaka ➔ Sreemangal Tea Estates
                </button>
              </li>
            </ul>
          </div>

          {/* Video Specs */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Reel Formats
            </h4>
            <ul className="flex flex-col gap-2">
              <li>Instagram Story (9:16 Portrait)</li>
              <li>TikTok & Facebook Story (9:16)</li>
              <li>WhatsApp Status (9:16)</li>
              <li>YouTube Landscape (16:9)</li>
              <li>Square Post (1:1)</li>
            </ul>
          </div>

          {/* Technology & Open Data */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Data & Attribution
            </h4>
            <p className="leading-relaxed mb-2">
              Cartography: OpenStreetMap & Carto GL.
              <br />
              Road Routing: OSRM Project.
              <br />
              Video Rendering: HTML5 Canvas & WebCodecs MediaStream engine.
            </p>
            <div className="text-[11px] text-slate-500">
              Zero mock downloads — actual video file generation.
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <div>
            © {new Date().getFullYear()} RouteReel. Built for explorers and storytellers in Bangladesh.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Made with passion for Bangladesh road trips</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
