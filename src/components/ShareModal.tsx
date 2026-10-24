import React, { useState, useEffect, useRef } from 'react';
import { JourneyConfig, RouteGeometry } from '../types/route';
import {
  Share2,
  Copy,
  Check,
  Download,
  X,
  ExternalLink,
  MessageCircle,
  Facebook,
  Twitter,
  Send,
  Compass,
  Sparkles
} from 'lucide-react';
import { CarIcon, BusIcon, TrainIcon, MotorcycleIcon, AirplaneIcon } from '../utils/vehicleIcons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: JourneyConfig;
  route: RouteGeometry;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  config,
  route
}) => {
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate shareable URL with parameters
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?start=${encodeURIComponent(
        config.startLocation.id
      )}&dest=${encodeURIComponent(
        config.destination.id
      )}&vehicle=${config.vehicle}&theme=${config.mapTheme}&duration=${config.duration}`
    : '';

  const shareText = `Check out my travel route in Bangladesh: ${config.startLocation.name} to ${config.destination.name} (${route.distanceKm} km by ${config.vehicle})! 🇧🇩✈️`;

  // Generate Route Snapshot Card
  useEffect(() => {
    if (!isOpen) return;

    setIsGeneratingImage(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675; // 16:9 social share standard
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Dark Modern Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 675);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 675);

    // Decorative grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 675);
      ctx.stroke();
    }
    for (let y = 0; y < 675; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1200, y);
      ctx.stroke();
    }

    // 2. Header Branding
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(80, 60, 48, 48, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px "Outfit", sans-serif';
    ctx.fillText('RouteReel', 145, 95);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Bangladesh Animated Travel Map', 145, 120);

    // 3. Central Route Card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80, 160, 1040, 360, 24);
    ctx.fill();
    ctx.stroke();

    // Start Location Tag
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(150, 260, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('🟢 START', 180, 245);
    ctx.font = '800 44px "Outfit", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(config.startLocation.name, 180, 295);
    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(config.startLocation.district + ', Bangladesh', 180, 325);

    // Arrow / Connection line
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(560, 270);
    ctx.lineTo(640, 270);
    ctx.stroke();
    ctx.setLineDash([]);

    // Destination Tag
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(710, 260, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('🏁 DESTINATION', 740, 245);
    ctx.font = '800 44px "Outfit", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(config.destination.name, 740, 295);
    ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(config.destination.district + ', Bangladesh', 740, 325);

    // Horizontal Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 380);
    ctx.lineTo(1080, 380);
    ctx.stroke();

    // 4. Travel Metrics in Card Footer
    // Distance Metric
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 32px "Outfit", sans-serif';
    ctx.fillText(`${route.distanceKm} KM`, 140, 440);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('TOTAL DISTANCE', 140, 470);

    // Vehicle Metric
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 32px "Outfit", sans-serif';
    ctx.fillText(config.vehicle.toUpperCase(), 480, 440);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('TRAVEL MODE', 480, 470);

    // Duration Metric
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 32px "Outfit", sans-serif';
    ctx.fillText(`${config.duration} SECONDS`, 820, 440);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('VIDEO REEL', 820, 470);

    // 5. Bottom Watermark
    ctx.fillStyle = '#64748b';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('🇧🇩 Made with RouteReel · Explore Beautiful Bangladesh', 80, 580);

    const dataUrl = canvas.toDataURL('image/png');
    setPreviewImage(dataUrl);
    setIsGeneratingImage(false);
  }, [isOpen, config, route]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadPreview = () => {
    if (!previewImage) return;
    const a = document.createElement('a');
    a.href = previewImage;
    a.download = `RouteReel_${config.startLocation.name}_to_${config.destination.name}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `RouteReel: ${config.startLocation.name} to ${config.destination.name}`,
          text: shareText,
          url: shareUrl
        });
      } catch {
        // cancelled
      }
    } else {
      handleCopy();
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                ম্যাপ শেয়ার করুন (Share Route)
              </h3>
              <p className="text-xs text-slate-500">
                Generate shareable link or preview image card
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* 1. Preview Image Card */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">রুট প্রিভিউ কার্ড (Preview Image)</span>
              {previewImage && (
                <button
                  onClick={handleDownloadPreview}
                  className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image (PNG)</span>
                </button>
              )}
            </div>

            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Route Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  Generating preview card...
                </div>
              )}
            </div>
          </div>

          {/* 2. Direct Shareable Link */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              শেয়ারযোগ্য সরাসরি লিঙ্ক (Shareable Direct Link)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-800 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Anyone opening this link will immediately view this route, travel distance, and animated video preview.
            </p>
          </div>

          {/* 3. Social Media Share Buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-700">
              সোশ্যাল মিডিয়াতে শেয়ার করুন (Share to Social Media)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <Facebook className="w-4 h-4" />
                <span>Facebook</span>
              </a>

              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <Twitter className="w-4 h-4" />
                <span>X / Twitter</span>
              </a>

              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Telegram</span>
              </a>
            </div>

            {/* Native Device Share */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="mt-1 w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-rose-600" />
                <span>ডিভাইস অ্যাপস দিয়ে শেয়ার (Share via Device Apps)</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
