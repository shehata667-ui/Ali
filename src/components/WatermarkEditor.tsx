import React, { useRef, useState, useEffect } from 'react';
import { Type, Image as ImageIcon, Plus, Minus, Move, Bookmark, Check, Trash2, Sliders } from 'lucide-react';
import { ProcessingSettings, WatermarkConfig } from '../types';

interface WatermarkEditorProps {
  settings: ProcessingSettings;
  onUpdateSettings: (updater: (prev: ProcessingSettings) => ProcessingSettings) => void;
}

interface SavedTemplate {
  id: string;
  name: string;
  config: WatermarkConfig;
}

export const WatermarkEditor: React.FC<WatermarkEditorProps> = ({
  settings,
  onUpdateSettings
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const wm = settings.watermark;
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(() => {
    try {
      const stored = localStorage.getItem('tiktok_studio_wm_templates');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save username to localStorage whenever it changes
  useEffect(() => {
    if (wm.text) {
      try {
        localStorage.setItem('tiktok_studio_last_username', wm.text);
      } catch {}
    }
  }, [wm.text]);

  const updateWm = (updater: (prev: WatermarkConfig) => Partial<WatermarkConfig>) => {
    onUpdateSettings((s) => ({
      ...s,
      watermark: {
        ...s.watermark,
        ...updater(s.watermark)
      }
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    updateWm(() => ({
      enabledLogo: true,
      logoUrl: url,
      logoFile: file
    }));
  };

  const applyPresetPosition = (target: 'text' | 'logo', pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'top-center' | 'bottom-center') => {
    let x = 50;
    let y = 50;
    switch (pos) {
      case 'top-left': x = 20; y = 12; break;
      case 'top-right': x = 80; y = 12; break;
      case 'bottom-left': x = 20; y = 88; break;
      case 'bottom-right': x = 80; y = 88; break;
      case 'center': x = 50; y = 50; break;
      case 'top-center': x = 50; y = 12; break;
      case 'bottom-center': x = 50; y = 88; break;
    }

    if (target === 'text') {
      updateWm(() => ({ textXPercent: x, textYPercent: y }));
    } else {
      updateWm(() => ({ logoXPercent: x, logoYPercent: y }));
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const newTpl: SavedTemplate = {
      id: `tpl_${Date.now()}`,
      name: templateName.trim(),
      config: { ...wm, logoUrl: undefined, logoFile: undefined }
    };
    const updated = [...savedTemplates, newTpl];
    setSavedTemplates(updated);
    try {
      localStorage.setItem('tiktok_studio_wm_templates', JSON.stringify(updated));
    } catch {}
    setTemplateName('');
  };

  const handleLoadTemplate = (tpl: SavedTemplate) => {
    updateWm((prev) => ({
      ...tpl.config,
      logoUrl: prev.logoUrl,
      logoFile: prev.logoFile
    }));
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = savedTemplates.filter((t) => t.id !== id);
    setSavedTemplates(updated);
    try {
      localStorage.setItem('tiktok_studio_wm_templates', JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="space-y-8 text-right">
      {/* 1. Text Watermark / Username Card */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                اسم المستخدم والنص التعريفي
              </h3>
              <p className="text-xs text-zinc-400">
                يُدمج فعليًا في الفيديو لحماية حقوقك وإظهار حسابك في تيك توك.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={wm.enabledText}
              onChange={(e) => updateWm(() => ({ enabledText: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        {wm.enabledText && (
          <div className="space-y-4 pt-2 border-t border-zinc-800/80">
            {/* Input field */}
            <div>
              <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                نص العلامة المائية (اسم حسابك)
              </label>
              <input
                type="text"
                value={wm.text}
                onChange={(e) => updateWm(() => ({ text: e.target.value }))}
                placeholder="@my_tiktok_id"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-sans text-zinc-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Font Size with Buttons & Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>حجم خط النص</span>
                <span className="font-mono">{wm.fontSize} px</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateWm((p) => ({ fontSize: Math.max(16, p.fontSize - 4) }))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200 hover:bg-zinc-700"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="16"
                  max="72"
                  value={wm.fontSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateWm(() => ({ fontSize: val }));
                  }}
                  className="flex-1 accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => updateWm((p) => ({ fontSize: Math.min(84, p.fontSize + 4) }))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200 hover:bg-zinc-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Opacity & Shadow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>الشفافية</span>
                  <span className="font-mono">{Math.round(wm.textOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={wm.textOpacity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateWm(() => ({ textOpacity: val }));
                  }}
                  className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-zinc-300">إضافة ظل داكن للنص لتعزيز القراءة</span>
                <button
                  onClick={() => updateWm((p) => ({ hasShadow: !p.hasShadow }))}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    wm.hasShadow ? 'bg-rose-500 justify-end' : 'bg-zinc-800 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow" />
                </button>
              </div>
            </div>

            {/* Quick Position Presets */}
            <div className="space-y-2 pt-2">
              <label className="text-xs text-zinc-400 block">
                المواضع الجاهزة للنص:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'bottom-center', label: 'أسفل الوسط' },
                  { id: 'bottom-right', label: 'أسفل اليمين' },
                  { id: 'bottom-left', label: 'أسفل اليسار' },
                  { id: 'top-right', label: 'أعلى اليمين' },
                  { id: 'top-left', label: 'أعلى اليسار' },
                  { id: 'top-center', label: 'أعلى الوسط' },
                  { id: 'center', label: 'المنتصف' }
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => applyPresetPosition('text', pos.id as any)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Logo / PNG Watermark Card */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                الشعار الصوري (PNG Logo)
              </h3>
              <p className="text-xs text-zinc-400">
                يدعم صور PNG الشفافة والصور بجودة عالية.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={wm.enabledLogo}
              onChange={(e) => updateWm(() => ({ enabledLogo: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
          </label>
        </div>

        {wm.enabledLogo && (
          <div className="space-y-4 pt-2 border-t border-zinc-800/80">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />

            <div className="flex items-center gap-4">
              {wm.logoUrl ? (
                <div className="relative w-16 h-16 rounded-xl border border-zinc-700 bg-transparency-grid overflow-hidden shrink-0 flex items-center justify-center p-1">
                  <img
                    src={wm.logoUrl}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 flex items-center justify-center text-zinc-600 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              <button
                onClick={() => logoInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 transition"
              >
                {wm.logoUrl ? 'تغيير صورة الشعار' : 'اختيار صورة الشعار من الهاتف'}
              </button>
            </div>

            {wm.logoUrl && (
              <>
                {/* Logo Size */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <span>حجم الشعار (نسبة العرض)</span>
                    <span className="font-mono">{wm.logoWidthPercent}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateWm((p) => ({ logoWidthPercent: Math.max(8, p.logoWidthPercent - 3) }))}
                      className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200 hover:bg-zinc-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min="8"
                      max="45"
                      value={wm.logoWidthPercent}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        updateWm(() => ({ logoWidthPercent: val }));
                      }}
                      className="flex-1 accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <button
                      onClick={() => updateWm((p) => ({ logoWidthPercent: Math.min(50, p.logoWidthPercent + 3) }))}
                      className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200 hover:bg-zinc-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Logo Opacity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span>شفافية الشعار</span>
                    <span className="font-mono">{Math.round(wm.logoOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={wm.logoOpacity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateWm(() => ({ logoOpacity: val }));
                    }}
                    className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Quick Positions */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs text-zinc-400 block">
                    المواضع الجاهزة للشعار:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'top-right', label: 'أعلى اليمين' },
                      { id: 'top-left', label: 'أعلى اليسار' },
                      { id: 'bottom-right', label: 'أسفل اليمين' },
                      { id: 'bottom-left', label: 'أسفل اليسار' },
                      { id: 'center', label: 'الوسط' }
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() => applyPresetPosition('logo', pos.id as any)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Watermark Templates Manager */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-rose-400" />
          <span>حفظ واسترجاع قوالب العلامة المائية</span>
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="اسم القالب (مثال: قالب البودكاست)"
            className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
          />
          <button
            onClick={handleSaveTemplate}
            disabled={!templateName.trim()}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-semibold text-white whitespace-nowrap"
          >
            حفظ كقالب جديد
          </button>
        </div>

        {savedTemplates.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs text-zinc-400 block">القوالب المحفوظة:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {savedTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs"
                >
                  <span className="font-medium text-zinc-200">{tpl.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoadTemplate(tpl)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    >
                      تطبيق
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
