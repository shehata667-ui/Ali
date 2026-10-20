import React, { useState } from 'react';
import { X, Smartphone, Download, CheckCircle2, QrCode, FileCode, Sparkles, ShieldCheck, GitBranch, Terminal } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDirectDownloading, setIsDirectDownloading] = useState(false);
  const [isZipDownloading, setIsZipDownloading] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const res = await install();
    if (res) {
      alert('تم تثبيت التطبيق بنجاح على هاتفك الأندرويد!');
    }
  };

  const handleDirectApkDownload = () => {
    setIsDirectDownloading(true);
    const link = document.createElement('a');
    link.href = '/TikTokStudio.apk';
    link.download = 'TikTokStudio.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDirectDownloading(false), 2000);
  };

  const handleDownloadProjectZip = () => {
    setIsZipDownloading(true);
    const link = document.createElement('a');
    link.href = '/TikTokStudio-Android-Project.zip';
    link.download = 'TikTokStudio-Android-Project.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsZipDownloading(false), 2000);
  };

  const currentAppUrl = window.location.href;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentAppUrl)}&color=fe2c55&bgcolor=09090b`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 text-right space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                مركز تثبيت وتنزيل تطبيق TikTok Video Studio (APK)
              </h3>
              <p className="text-xs text-zinc-400">
                تحميل حزمة Android كاملة وروابط التنزيل المباشرة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Direct APK File Download Link */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/40 via-zinc-900 to-zinc-950 border-2 border-rose-500 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ملف الـ APK المباشر (Direct APK File)</span>
              </span>
              <h4 className="text-base font-bold text-white">
                TikTokStudio.apk — جاهز للتنزيل الفوري
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                ملف حزمة أندرويد (<span className="font-mono text-rose-300">.apk</span>) مجهز للتنزيل الفوري على هاتفك.
              </p>
            </div>
            <div className="px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold shrink-0">
              APK v1.0.0
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleDirectApkDownload}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-600/30 transition transform hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4" />
              <span>{isDirectDownloading ? 'جاري التنزيل...' : 'تنزيل ملف TikTokStudio.apk فوراً'}</span>
            </button>

            <a
              href="/TikTokStudio.apk"
              download="TikTokStudio.apk"
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition text-center whitespace-nowrap"
            >
              رابط مباشر للمتصفح
            </a>
          </div>

          {/* Installation guide */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-400 space-y-1.5">
            <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>خطوات تثبيت ملف الـ APK على هاتف Android:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pr-1 text-[11px] text-zinc-400">
              <li>اضغط على زر «تنزيل ملف TikTokStudio.apk» أعلاه.</li>
              <li>افتح الملف المنزّل من شريط الإشعارات أو تطبيق «الملفات» (Files).</li>
              <li>اختر «تثبيت» (إذا طلب الهاتف إذناً، فعّل خيار «السماح بالتثبيت من هذا المصدر»).</li>
              <li>سيتم تثبيت التطبيق بنجاح كبرنامج أصلي على هاتفك.</li>
            </ol>
          </div>
        </div>

        {/* 2. Download Native Android Studio & Gradle Project ZIP (438 KB) */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" />
              <span>مشروع أندرويد ستوديو المكتمل (Native Gradle Project)</span>
            </span>
            <h4 className="text-sm font-bold text-white">
              TikTokStudio-Android-Project.zip (الحجم: 438 KB)
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              تم تحويل وتجهيز التطبيق بالكامل داخل مجلد <code className="font-mono text-zinc-300">android/</code> عبر <span className="text-white font-semibold">Capacitor</span> ويحتوي على كافة أصول الويب المدمجة، ملف <code className="font-mono text-zinc-300">AndroidManifest.xml</code>، وجميع إعدادات الـ Gradle لتجميعه في Android Studio بنقرة واحدة.
            </p>
          </div>

          <button
            onClick={handleDownloadProjectZip}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-semibold transition"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>{isZipDownloading ? 'جاري التحميل...' : 'تنزيل مشروع Gradle الكامل (ZIP)'}</span>
          </button>
        </div>

        {/* 3. GitHub Actions Free Automated APK Release */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              <span>البناء السحابي المجاني عبر GitHub Actions</span>
            </span>
            <h4 className="text-sm font-bold text-white">
              بناء وتوقيع الـ Release APK عبر السحابة مجاناً
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              تم إنشاء ملف <code className="font-mono text-zinc-300">.github/workflows/build-apk.yml</code> داخل المشروع تلقائياً. عند رفع الكود على GitHub، ستقوم خوادم GitHub (المزودة بـ Android SDK 35 و JDK 17) ببناء ملف <span className="font-mono text-white">app-debug.apk</span> وإعطائك رابط تنزيل مباشر في تبويب Actions مجاناً 100%!
            </p>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>ملف البناء جاهز في: .github/workflows/build-apk.yml</span>
            <span className="text-emerald-400 font-semibold">جاهز للتشغيل</span>
          </div>
        </div>

        {/* 4. Native 1-Click PWA / WebAPK Installation */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
              التثبيت الفوري التلقائي (WebAPK)
            </span>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>تثبيت بنقرة واحدة داخل درج التطبيقات (App Drawer)</span>
              {isInstalled && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              يقوم متصفح Google Chrome على هواتف Android بتحويل التطبيق فوراً إلى تطبيق WebAPK أصلي مثبت على جهازك مع شاشة كاملة ودعم معالجة الفيديو بالعتاد دون الحاجة لملفات تثبيت إضافية.
            </p>
          </div>

          <div className="pt-1">
            {isInstalled ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
                <span>التطبيق مثبت بالفعل ويعمل كبرنامج نظام مستقل على جهازك!</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md"
              >
                <Smartphone className="w-4 h-4" />
                <span>تثبيت التطبيق على هذا الهاتف فوراً (Install WebAPK)</span>
              </button>
            ) : isIOS ? (
              <div className="text-xs text-zinc-300 p-3 rounded-xl bg-zinc-800/80">
                أنت تستخدم جهاز iOS (iPhone/iPad): اضغط على زر <strong>مشاركة (Share)</strong> في Safari ثم اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-zinc-400">
                  لتثبيت التطبيق الفوري: افتح هذا الرابط في متصفح <strong>Google Chrome</strong> على هاتفك واضغط على «<strong>تثبيت التطبيق</strong>».
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentAppUrl);
                    alert('تم نسخ رابط التطبيق! افتحه في متصفح كروم على هاتفك لتثبيته بنقرة واحدة.');
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200"
                >
                  نسخ رابط التطبيق لفتحه على هاتف الأندرويد
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 5. QR Code for Instant Phone Scan */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-zinc-800 bg-zinc-950 p-2 shrink-0 flex items-center justify-center">
            <img
              src={qrCodeUrl}
              alt="Scan QR to install on Android"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>

          <div className="space-y-1.5 text-center sm:text-right">
            <h4 className="text-xs font-bold text-zinc-200 flex items-center justify-center sm:justify-start gap-1.5">
              <QrCode className="w-4 h-4 text-rose-400" />
              <span>مسح الرمز بكاميرا هاتف Android</span>
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              وجّه كاميرا هاتفك نحو رمز الاستجابة السريعة لفتح التطبيق وتنزيل ملف الـ APK مباشرة على هاتفك.
            </p>
            <div className="text-[11px] font-mono text-zinc-500 truncate max-w-xs">
              {currentAppUrl}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
