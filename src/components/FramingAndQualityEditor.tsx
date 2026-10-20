import React from 'react';
import { Sliders, RotateCw, Volume2, VolumeX, Shield, Check, RefreshCw, Scissors, Sparkles } from 'lucide-react';
import { ProcessingSettings, QualityPresetType, VideoFileItem } from '../types';

interface FramingAndQualityEditorProps {
  settings: ProcessingSettings;
  onUpdateSettings: (updater: (prev: ProcessingSettings) => ProcessingSettings) => void;
  activeVideo?: VideoFileItem;
}

export const FramingAndQualityEditor: React.FC<FramingAndQualityEditorProps> = ({
  settings,
  onUpdateSettings,
  activeVideo
}) => {
  const duration = activeVideo?.duration || 15;

  // Calculate estimated file size: (Bitrate in kbps * duration in sec) / 8 / 1024 = MB
  const totalBitrateKbps = settings.videoBitrateKbps + settings.audioBitrateKbps;
  const effectiveDuration = Math.max(0.5, (settings.trimEndSeconds || duration) - settings.trimStartSeconds);
  const estimatedSizeBytes = (totalBitrateKbps * 1000 * effectiveDuration) / 8;
  const estimatedSizeMb = (estimatedSizeBytes / (1024 * 1024)).toFixed(2);

  const setQualityPreset = (preset: QualityPresetType) => {
    let videoBitrate = 5500;
    if (preset === 'low') videoBitrate = 2500;
    else if (preset === 'ultra') videoBitrate = 9500;

    onUpdateSettings((s) => ({
      ...s,
      qualityPreset: preset,
      videoBitrateKbps: videoBitrate
    }));
  };

  const handleResetEffects = () => {
    onUpdateSettings((s) => ({
      ...s,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      volume: 100,
      isMuted: false,
      panX: 0,
      panY: 0,
      rotation: 0,
      trimStartSeconds: 0,
      trimEndSeconds: activeVideo?.duration || 0
    }));
  };

  return (
    <div className="space-y-8 text-right">
      {/* 1. Resolution & Dimension Configuration */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">
            أبعاد الفيديو لمقاس TikTok 9:16
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            {settings.targetWidth} × {settings.targetHeight} px
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onUpdateSettings((s) => ({ ...s, targetWidth: 1080, targetHeight: 1920 }))}
            className={`p-4 rounded-xl border text-right transition ${
              settings.targetWidth === 1080
                ? 'border-rose-500 bg-rose-500/10 text-white'
                : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">1080 × 1920 (Full HD)</span>
              {settings.targetWidth === 1080 && <Check className="w-4 h-4 text-rose-400" />}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              المقاس القياسي الموصى به لصفحة For You بجودة فائقة ونقاء حواف.
            </p>
          </button>

          <button
            onClick={() => onUpdateSettings((s) => ({ ...s, targetWidth: 720, targetHeight: 1280 }))}
            className={`p-4 rounded-xl border text-right transition ${
              settings.targetWidth === 720
                ? 'border-rose-500 bg-rose-500/10 text-white'
                : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">720 × 1280 (HD سريع)</span>
              {settings.targetWidth === 720 && <Check className="w-4 h-4 text-rose-400" />}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              حجم أصغر وسرعة تصدير ورفع أعلى، مناسب للفيديوهات الطويلة أو اتصالات الإنترنت الضعيفة.
            </p>
          </button>
        </div>

        {/* Orientation & Rotation */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-zinc-300">تصحيح اتجاه وتدوير الفيديو</span>
          <div className="flex items-center gap-1.5">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => onUpdateSettings((s) => ({ ...s, rotation: deg as any }))}
                className={`px-3 py-1.5 text-xs rounded-lg border font-mono transition ${
                  settings.rotation === deg
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-semibold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Quality & Bitrate Compression */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              ضغط الفيديو والتحكم بمعدل البت (Bitrate)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              الحجم التقديري الناتج: حوالي <span className="font-mono text-rose-400 font-semibold">{estimatedSizeMb} MB</span>
            </p>
          </div>
        </div>

        {/* Quality Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'low', label: 'منخفضة', bitrate: 2500, desc: 'حجم ملف صغير جدًا' },
            { id: 'balanced', label: 'متوازنة (موصى بها)', bitrate: 5500, desc: 'التوازن المثالي لـ TikTok' },
            { id: 'ultra', label: 'فائقة الوضوح', bitrate: 9500, desc: 'أعلى نقاء بدون ضغط' },
            { id: 'custom', label: 'مخصص', bitrate: settings.videoBitrateKbps, desc: 'تحكم يدوي دقيق' }
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setQualityPreset(preset.id as QualityPresetType)}
              className={`p-3 text-right rounded-xl border transition ${
                settings.qualityPreset === preset.id
                  ? 'border-rose-500 bg-rose-500/10 text-white'
                  : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="font-semibold text-xs">{preset.label}</div>
              <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{preset.bitrate} Kbps</div>
            </button>
          ))}
        </div>

        {/* Custom Bitrate Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs text-zinc-300">
            <span>معدل بت الفيديو المخصص (Video Bitrate)</span>
            <span className="font-mono text-zinc-100">{settings.videoBitrateKbps} Kbps</span>
          </div>
          <input
            type="range"
            min="1500"
            max="16000"
            step="250"
            value={settings.videoBitrateKbps}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onUpdateSettings((s) => ({
                ...s,
                qualityPreset: 'custom',
                videoBitrateKbps: val
              }));
            }}
            className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Frame Rate Lock (CFR vs VFR) */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-zinc-200">
                تثبيت معدل الإطارات (Force CFR Constant Frame Rate)
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                يمنع تشنج الحركة وتكرار أو سقوط الإطارات (Lag) بعد التصدير
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateSettings((s) => ({ ...s, targetFps: 30 }))}
                className={`px-3 py-1 text-xs rounded-md font-mono ${
                  settings.targetFps === 30 ? 'bg-rose-500 text-white font-semibold' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                30 FPS
              </button>
              <button
                onClick={() => onUpdateSettings((s) => ({ ...s, targetFps: 60 }))}
                className={`px-3 py-1 text-xs rounded-md font-mono ${
                  settings.targetFps === 60 ? 'bg-rose-500 text-white font-semibold' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                60 FPS
              </button>
            </div>
          </div>
        </div>

        {/* Audio Bitrate & Volume */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-300">
              <span>مستوى الصوت (Volume)</span>
              <span className="font-mono">{settings.isMuted ? 'مكتوم' : `${settings.volume}%`}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateSettings((s) => ({ ...s, isMuted: !s.isMuted }))}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
              >
                {settings.isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="150"
                disabled={settings.isMuted}
                value={settings.volume}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onUpdateSettings((s) => ({ ...s, volume: val }));
                }}
                className="flex-1 accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-300">
              <span>معدل بت الصوت (Audio Bitrate)</span>
              <span className="font-mono">{settings.audioBitrateKbps} Kbps</span>
            </div>
            <div className="flex items-center gap-2">
              {[128, 192, 320].map((rate) => (
                <button
                  key={rate}
                  onClick={() => onUpdateSettings((s) => ({ ...s, audioBitrateKbps: rate }))}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-mono transition ${
                    settings.audioBitrateKbps === rate
                      ? 'border-rose-500 bg-rose-500/20 text-rose-300 font-semibold'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                  }`}
                >
                  {rate}k
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visual Adjustments (Brightness, Contrast, Saturation) */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-rose-400" />
            <span>تصحيح الألوان والسطوع الاختياري</span>
          </h3>
          <button
            onClick={handleResetEffects}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة ضبط الكل</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-300">
              <span>السطوع</span>
              <span className="font-mono">{settings.brightness > 0 ? `+${settings.brightness}` : settings.brightness}%</span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              value={settings.brightness}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                onUpdateSettings((s) => ({ ...s, brightness: val }));
              }}
              className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-300">
              <span>التباين</span>
              <span className="font-mono">{settings.contrast > 0 ? `+${settings.contrast}` : settings.contrast}%</span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              value={settings.contrast}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                onUpdateSettings((s) => ({ ...s, contrast: val }));
              }}
              className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-300">
              <span>التشبع</span>
              <span className="font-mono">{settings.saturation > 0 ? `+${settings.saturation}` : settings.saturation}%</span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              value={settings.saturation}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                onUpdateSettings((s) => ({ ...s, saturation: val }));
              }}
              className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Trim Timeline */}
        {activeVideo && (
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                <span>قص البداية والنهاية (Trim)</span>
              </span>
              <span className="font-mono text-zinc-400">
                من {settings.trimStartSeconds.toFixed(1)} ث إلى {(settings.trimEndSeconds || activeVideo.duration).toFixed(1)} ث
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-zinc-400">قص البداية (ثانية)</label>
                <input
                  type="number"
                  min="0"
                  max={Math.max(0, (settings.trimEndSeconds || activeVideo.duration) - 1)}
                  step="0.5"
                  value={settings.trimStartSeconds}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdateSettings((s) => ({ ...s, trimStartSeconds: val }));
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400">قص النهاية (ثانية)</label>
                <input
                  type="number"
                  min={settings.trimStartSeconds + 1}
                  max={activeVideo.duration}
                  step="0.5"
                  value={settings.trimEndSeconds || activeVideo.duration}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || activeVideo.duration;
                    onUpdateSettings((s) => ({ ...s, trimEndSeconds: val }));
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Metadata Stripper Toggle */}
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>مسح البيانات الوصفية الشخصية (EXIF & Device Metadata)</span>
          </div>
          <div className="text-[11px] text-zinc-400">
            تجريد الفيديو المصدر من إحداثيات الموقع ونوع الهاتف وتاريخ التصوير لحماية الخصوصية.
          </div>
        </div>

        <button
          onClick={() => onUpdateSettings((s) => ({ ...s, stripMetadata: !s.stripMetadata }))}
          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
            settings.stripMetadata ? 'bg-rose-500 justify-end' : 'bg-zinc-800 justify-start'
          }`}
        >
          <div className="bg-white w-4 h-4 rounded-full shadow-md" />
        </button>
      </div>
    </div>
  );
};
