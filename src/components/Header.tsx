import React from 'react';
import { Smartphone, Download, CheckCircle2, Sparkles } from 'lucide-react';
import { downloadApkFile } from '../services/apkDownloader';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenApkModal: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  exportedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenApkModal,
  isInstalled,
  exportedCount
}) => {
  const navItems = [
    { id: 'studio', label: 'الاستوديو والمعاينة' },
    { id: 'apk', label: 'تنزيل ملف الـ APK 📲' },
    { id: 'inspector', label: 'الفحص الفني واللاج' },
    { id: 'framing', label: 'المقاس 9:16 والجودة' },
    { id: 'watermark', label: 'العلامة المائية' },
    { id: 'batch', label: 'المعالجة الجماعية' },
    { id: 'exported', label: `المنجزات (${exportedCount})` },
    { id: 'authenticity', label: 'دليل خوارزمية تيك توك' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => setActiveTab('studio')}
          className="flex items-center gap-3 shrink-0 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <span className="font-bold text-white text-base tracking-tighter">9:16</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            TikTok Video Studio
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap transition-colors py-1 text-sm ${
                activeTab === item.id
                  ? 'text-rose-400 font-semibold border-b-2 border-rose-500'
                  : item.id === 'apk'
                  ? 'text-rose-400 font-semibold hover:text-rose-300'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Direct APK Download & Installation CTAs */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => downloadApkFile('TikTokStudio.apk')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-lg shadow-rose-600/30 transition whitespace-nowrap animate-pulse"
            title="تنزيل ملف TikTokStudio.apk فوراً"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل ملف APK فوراً</span>
          </button>

          <button
            onClick={onOpenApkModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white transition shadow-sm whitespace-nowrap"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isInstalled ? 'تطبيق مثبت' : 'خيارات التثبيت'}</span>
            {isInstalled && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-zinc-800/60 no-scrollbar bg-zinc-950">
        <button
          onClick={() => downloadApkFile('TikTokStudio.apk')}
          className="whitespace-nowrap px-3.5 py-1.5 rounded-md text-xs font-bold bg-rose-600 text-white flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>تنزيل APK</span>
        </button>

        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === item.id
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
