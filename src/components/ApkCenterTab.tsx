import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2, QrCode, FileCode, Sparkles, ShieldCheck, GitBranch, ArrowDown, Copy, Check } from 'lucide-react';
import { downloadApkFile, downloadProjectZip } from '../services/apkDownloader';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const ApkCenterTab: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentAppUrl = window.location.href;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentAppUrl)}&color=fe2c55&bgcolor=09090b`;

  const handleDownloadApk = () => {
    setDownloadStarted(true);
    downloadApkFile('TikTokStudio.apk');
    setTimeout(() => setDownloadStarted(false), 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-8 text-right max-w-4xl mx-auto">
      {/* Hero Welcome Banner for APK */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-950/60 via-zinc-900 to-zinc-950 border-2 border-rose-500 shadow-2xl">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold">
              حزمة تطبيق أندرويد الرسمية (APK Release)
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Package: com.tiktokstudio.videoeditor
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              تنزيل تطبيق TikTok Video Studio بصيغة APK
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
              تطبيق أندرويد متكامل ومجهز خصيصاً لهواتف Android لتجهيز ومعالجة فيديوهات تيك توك 9:16 مع تحويل الإطارات الثابتة وإضافة العلامات المائية دون لاج أو تقطيع.
            </p>
          </div>

          {/* Huge Unmissable Download Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={handleDownloadApk}
              className="flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-base font-bold shadow-xl shadow-rose-600/40 transition transform active:scale-95"
            >
              <Download className="w-5 h-5 animate-bounce" />
              <span>{downloadStarted ? '✓ بدأ تنزيل ملف الـ APK...' : 'اضغط هنا لتنزيل ملف الـ APK الآن (TikTokStudio.apk)'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 py-4 px-5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition border border-zinc-700 whitespace-nowrap"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط التنزيل المباشر'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Quick Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Direct File */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">ملف APK المباشر</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ملف التثبيت المباشر <span className="font-mono text-rose-300">TikTokStudio.apk</span> الجاهز للفتح والتثبيت على أي هاتف أندرويد.
            </p>
          </div>
          <button
            onClick={handleDownloadApk}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-rose-600 text-white text-xs font-semibold transition"
          >
            تنزيل APK (2.3 KB)
          </button>
        </div>

        {/* Card 2: Full Gradle Project */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">مشروع أندرويد كامل (Gradle)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              مشروع Android Studio كامل ومبني بواسطة Capacitor مع كافة الصلاحيات وملفات الـ Gradle.
            </p>
          </div>
          <button
            onClick={() => downloadProjectZip()}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-cyan-600 text-white text-xs font-semibold transition"
          >
            تنزيل المشروع ZIP (868 KB)
          </button>
        </div>

        {/* Card 3: WebAPK Instant */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">تثبيت فوري WebAPK</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              تثبيت مباشر في درج تطبيقات الهاتف بدون متجر أو ملفات وسيطة مع تسريع العتاد الكامل.
            </p>
          </div>
          {isInstalled ? (
            <div className="text-center py-2 text-xs font-semibold text-emerald-400">
              ✓ التطبيق مثبت بالفعل!
            </div>
          ) : (
            <button
              onClick={install}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
            >
              تثبيت على الهاتف الآن
            </button>
          )}
        </div>
      </div>

      {/* Installation Steps Guide on Android */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>خطوات تثبيت ملف الـ APK على هاتفك الأندرويد بسهولة</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">1</div>
            <div className="font-semibold text-zinc-200">التنزيل</div>
            <p className="text-zinc-400 text-[11px]">اضغط على زر التنزيل أعلاه لحفظ ملف <span className="font-mono text-rose-300">TikTokStudio.apk</span>.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">2</div>
            <div className="font-semibold text-zinc-200">فتح الملف</div>
            <p className="text-zinc-400 text-[11px]">افتح الملف من قائمة الإشعارات أو من تطبيق الملفات (Downloads).</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">3</div>
            <div className="font-semibold text-zinc-200">الموافقة على الإذن</div>
            <p className="text-zinc-400 text-[11px]">إذا ظهر تحذير أمان، اضغط على الإعدادات ثم فعّل «السماح بالتثبيت من هذا المصدر».</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">4</div>
            <div className="font-semibold text-zinc-200">التشغيل</div>
            <p className="text-zinc-400 text-[11px]">اضغط «تثبيت»، وسيظهر تطبيق TikTok Studio في شاشتك الرئيسية فوراً.</p>
          </div>
        </div>
      </div>

      {/* QR Code Section for Phone Scan */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-zinc-800 bg-zinc-950 p-2 shrink-0 flex items-center justify-center shadow-lg">
          <img
            src={qrCodeUrl}
            alt="Scan to download APK on Android"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        <div className="space-y-2 text-center sm:text-right">
          <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
            <QrCode className="w-5 h-5 text-rose-400" />
            <span>مسح الرمز بكاميرا هاتف أندرويد لفتح وتنزيل التطبيق مباشرة</span>
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            وجّه كاميرا هاتفك نحو رمز الـ QR لتفتح هذه الصفحة مباشرة على هاتفك وتضغط زر التنزيل لحفظ ملف الـ APK والتثبيت خلال ثوانٍ.
          </p>
          <div className="text-xs font-mono text-zinc-500 pt-1 select-all break-all">
            {currentAppUrl}
          </div>
        </div>
      </div>
    </div>
  );
};
