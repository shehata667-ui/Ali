import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCw, Volume2, VolumeX, Eye, Sparkles, Move, Sliders, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ProcessingSettings, VideoFileItem } from '../types';

interface StudioWorkspaceProps {
  video?: VideoFileItem;
  settings: ProcessingSettings;
  onUpdateSettings: (updater: (prev: ProcessingSettings) => ProcessingSettings) => void;
  onOpenInspector: () => void;
  onStartExport: () => void;
  isExporting: boolean;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  video,
  settings,
  onUpdateSettings,
  onOpenInspector,
  onStartExport,
  isExporting
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDraggingWatermark, setIsDraggingWatermark] = useState<'text' | 'logo' | null>(null);

  // Sync video time
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onLoadedMetadata = () => {
      setDuration(el.duration || video?.duration || 0);
      if (settings.trimEndSeconds === 0) {
        onUpdateSettings((s) => ({ ...s, trimEndSeconds: el.duration || 0 }));
      }
    };
    const onEnded = () => setIsPlaying(false);

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('ended', onEnded);

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('ended', onEnded);
    };
  }, [video?.url]);

  // Live Canvas Rendering Loop for 9:16 Preview
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    const el = videoRef.current;
    if (!canvas || !el) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let logoImg: HTMLImageElement | null = null;
    if (settings.watermark.enabledLogo && settings.watermark.logoUrl) {
      logoImg = new Image();
      logoImg.src = settings.watermark.logoUrl;
    }

    const render = () => {
      const cw = canvas.width;
      const ch = canvas.height;
      const vw = el.videoWidth || 1280;
      const vh = el.videoHeight || 720;

      ctx.clearRect(0, 0, cw, ch);
      ctx.save();

      // Filters
      const b = 100 + settings.brightness;
      const c = 100 + settings.contrast;
      const s = 100 + settings.saturation;
      ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;

      // Framing
      if (settings.framingMode === 'blur-background') {
        // Blur background
        ctx.save();
        ctx.filter = `blur(${Math.min(settings.blurIntensity, 30)}px) brightness(60%)`;
        const bgScale = Math.max(cw / vw, ch / vh);
        const bgW = vw * bgScale;
        const bgH = vh * bgScale;
        const bgX = (cw - bgW) / 2;
        const bgY = (ch - bgH) / 2;
        ctx.drawImage(el, bgX, bgY, bgW, bgH);
        ctx.restore();

        // Focused foreground video
        const fgScale = Math.min(cw / vw, ch / vh);
        const fgW = vw * fgScale;
        const fgH = vh * fgScale;
        const fgX = (cw - fgW) / 2 + (settings.panX / 100) * (cw - fgW);
        const fgY = (ch - fgH) / 2 + (settings.panY / 100) * (ch - fgH);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 16;
        ctx.drawImage(el, fgX, fgY, fgW, fgH);
        ctx.shadowBlur = 0;

      } else if (settings.framingMode === 'crop-fill') {
        const scale = Math.max(cw / vw, ch / vh);
        const drawW = vw * scale;
        const drawH = vh * scale;
        const drawX = (cw - drawW) / 2 + (settings.panX / 100) * (cw - drawW);
        const drawY = (ch - drawH) / 2 + (settings.panY / 100) * (ch - drawH);
        ctx.drawImage(el, drawX, drawY, drawW, drawH);

      } else {
        // Fit Pad
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, cw, ch);
        const scale = Math.min(cw / vw, ch / vh);
        const drawW = vw * scale;
        const drawH = vh * scale;
        const drawX = (cw - drawW) / 2;
        const drawY = (ch - drawH) / 2;
        ctx.drawImage(el, drawX, drawY, drawW, drawH);
      }

      ctx.restore();

      // Watermarks
      // 1. Logo
      if (settings.watermark.enabledLogo && logoImg && logoImg.complete) {
        ctx.save();
        ctx.globalAlpha = Math.max(0.1, settings.watermark.logoOpacity);
        const logoTargetW = (cw * settings.watermark.logoWidthPercent) / 100;
        const logoAspect = logoImg.naturalWidth / (logoImg.naturalHeight || 1);
        const logoTargetH = logoTargetW / (logoAspect || 1);
        const logoX = (cw * settings.watermark.logoXPercent) / 100 - logoTargetW / 2;
        const logoY = (ch * settings.watermark.logoYPercent) / 100 - logoTargetH / 2;
        ctx.drawImage(logoImg, logoX, logoY, logoTargetW, logoTargetH);
        ctx.restore();
      }

      // 2. Text Watermark
      if (settings.watermark.enabledText && settings.watermark.text.trim()) {
        ctx.save();
        ctx.globalAlpha = Math.max(0.1, settings.watermark.textOpacity);
        const scaledSize = Math.round((settings.watermark.fontSize * cw) / 1080);
        ctx.font = `600 ${scaledSize}px 'Cairo', sans-serif`;
        ctx.fillStyle = settings.watermark.textColor || '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textX = (cw * settings.watermark.textXPercent) / 100;
        const textY = (ch * settings.watermark.textYPercent) / 100;

        if (settings.watermark.hasShadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = Math.round(scaledSize * 0.25);
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }

        ctx.fillText(settings.watermark.text, textX, textY);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [settings, isPlaying]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Draggable placement on Canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if clicked close to logo or text
    if (settings.watermark.enabledText) {
      onUpdateSettings((s) => ({
        ...s,
        watermark: {
          ...s.watermark,
          textXPercent: Math.round(xPct),
          textYPercent: Math.round(yPct)
        }
      }));
      setIsDraggingWatermark('text');
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingWatermark) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xPct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    onUpdateSettings((s) => ({
      ...s,
      watermark: {
        ...s.watermark,
        ...(isDraggingWatermark === 'text'
          ? { textXPercent: Math.round(xPct), textYPercent: Math.round(yPct) }
          : { logoXPercent: Math.round(xPct), logoYPercent: Math.round(yPct) })
      }
    }));
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingWatermark(null);
  };

  if (!video) {
    return null;
  }

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: 9:16 Interactive Canvas Screen (Phone Viewport) */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="w-full max-w-[340px] rounded-[36px] p-3 bg-zinc-900 border-4 border-zinc-800 shadow-2xl relative">
          {/* Phone Top Notch Bar */}
          <div className="w-24 h-4 bg-zinc-800 rounded-full mx-auto mb-2 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-zinc-700 mr-2" />
          </div>

          {/* 9:16 Canvas Viewport */}
          <div className="relative aspect-[9/16] w-full rounded-[24px] overflow-hidden bg-black border border-zinc-800 group select-none">
            {/* Hidden Source Video Element (Drives playback & canvas frames) */}
            <video
              ref={videoRef}
              src={video.url}
              playsInline
              muted={settings.isMuted}
              className="hidden"
            />

            {/* Real 9:16 Canvas (Calculated in real-time) */}
            <canvas
              ref={canvasRef}
              width={540}
              height={960}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="w-full h-full object-cover cursor-crosshair"
            />

            {/* Drag helper hint */}
            {settings.watermark.enabledText && (
              <div className="absolute top-3 inset-x-3 pointer-events-none flex justify-center">
                <span className="text-[10px] bg-black/60 backdrop-blur-sm text-zinc-300 px-2.5 py-1 rounded-full border border-zinc-700/50 flex items-center gap-1">
                  <Move className="w-3 h-3 text-cyan-400" />
                  اضغط واسحب لتغيير موضع العلامة المائية
                </span>
              </div>
            )}

            {/* Play/Pause Overlay Icon on hover */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-rose-500/90 text-white flex items-center justify-center shadow-lg">
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </div>
            </button>
          </div>

          {/* Bottom Player Controls */}
          <div className="mt-3 space-y-2 px-1">
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <span className="tabular-nums">{formatSec(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 1}
                step="0.05"
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 accent-rose-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <span className="tabular-nums">{formatSec(duration)}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                onClick={togglePlay}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-800 text-zinc-200 hover:text-white"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}</span>
              </button>

              <button
                onClick={() => onUpdateSettings((s) => ({ ...s, isMuted: !s.isMuted }))}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200"
                title={settings.isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
              >
                {settings.isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Framing Quick Presets & Control Center */}
      <div className="lg:col-span-7 space-y-6">
        {/* Active Video Info Card */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100 truncate max-w-[280px]">
              {video.name}
            </h3>
            <button
              onClick={onOpenInspector}
              className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>فحص اللاج والتقرير الكامل</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>الأصل: {video.width}×{video.height}</span>
            <span aria-hidden="true">·</span>
            <span>الهدف: {settings.targetWidth}×{settings.targetHeight} (9:16 تيك توك)</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-400">{settings.targetFps} FPS CFR</span>
          </div>
        </div>

        {/* Quick APK Direct Download Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-zinc-900 to-zinc-950 border border-rose-500/30 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>هل تريد تشغيل الاستوديو كتطبيق أندرويد مثبت؟</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              حمّل ملف <span className="font-mono text-rose-300">TikTokStudio.apk</span> وثبته مباشرة على هاتفك.
            </p>
          </div>

          <a
            href="/TikTokStudio.apk"
            download="TikTokStudio.apk"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition shrink-0 whitespace-nowrap"
          >
            <span>تنزيل APK مباشر</span>
          </a>
        </div>

        {/* Framing Mode Selection */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            طريقة معالجة الأبعاد لمقاس تيك توك (9:16)
          </h4>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'blur-background', label: 'خلفية ضبابية', desc: 'الحفاظ على كامل الفيديو مع تزيين الأطراف بضبابية' },
              { id: 'crop-fill', label: 'قص وتعبئة', desc: 'ملء الشاشة بالكامل مع تحريك زاوية القص' },
              { id: 'fit-pad', label: 'إطار نقي', desc: 'عرض الفيديو في المنتصف بإطار داكن' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => onUpdateSettings((s) => ({ ...s, framingMode: mode.id as any }))}
                className={`p-3 text-right rounded-xl border text-xs transition ${
                  settings.framingMode === mode.id
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-semibold'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="font-semibold">{mode.label}</div>
                <div className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{mode.desc}</div>
              </button>
            ))}
          </div>

          {/* Sub-controls based on framing mode */}
          {settings.framingMode === 'blur-background' && (
            <div className="pt-2 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>شدة ضبابية الخلفية</span>
                <span className="font-mono">{settings.blurIntensity}px</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                value={settings.blurIntensity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onUpdateSettings((s) => ({ ...s, blurIntensity: val }));
                }}
                className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg"
              />
            </div>
          )}

          {settings.framingMode === 'crop-fill' && (
            <div className="pt-2 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>إزاحة موضع القص الأفقي (Pan X)</span>
                  <span className="font-mono">{settings.panX}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={settings.panX}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onUpdateSettings((s) => ({ ...s, panX: val }));
                  }}
                  className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>إزاحة موضع القص العمودي (Pan Y)</span>
                  <span className="font-mono">{settings.panY}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={settings.panY}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onUpdateSettings((s) => ({ ...s, panY: val }));
                  }}
                  className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Export & Primary Action CTA */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-right">
            <h4 className="text-sm font-semibold text-zinc-100">
              جاهز للتجهيز والتصدير الفعلي
            </h4>
            <p className="text-xs text-zinc-400">
              معالجة تدفقية CFR بدون استهلاك زائد للذاكرة أو تقطيع في الصوت.
            </p>
          </div>

          <button
            onClick={onStartExport}
            disabled={isExporting}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-rose-600/20 whitespace-nowrap"
          >
            {isExporting ? 'جاري المعالجة...' : 'تصدير هذا الفيديو (9:16)'}
          </button>
        </div>
      </div>
    </div>
  );
};
