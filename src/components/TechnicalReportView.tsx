import React from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldCheck, Film, Cpu, HelpCircle } from 'lucide-react';
import { TechnicalReport, VideoFileItem } from '../types';

interface TechnicalReportViewProps {
  video: VideoFileItem;
  onApplyRecommendedFixes?: () => void;
}

export const TechnicalReportView: React.FC<TechnicalReportViewProps> = ({
  video,
  onApplyRecommendedFixes
}) => {
  const report = video.report;
  if (!report) {
    return (
      <div className="p-8 text-center text-zinc-400">
        جاري تحليل بيانات الفيديو... يرجى الانتظار
      </div>
    );
  }

  const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  const formatBitrate = (kbps: number) => (kbps > 1000 ? `${(kbps / 1000).toFixed(2)} Mbps` : `${kbps} Kbps`);

  return (
    <div className="space-y-6 text-right">
      {/* Overview Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 mb-1">الأبعاد والنسبة</div>
          <div className="font-mono text-sm font-semibold text-zinc-100">
            {report.width} × {report.height}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">{video.aspectRatio}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 mb-1">معدل الإطارات والنوع</div>
          <div className="font-mono text-sm font-semibold text-zinc-100">
            {report.fps} FPS
          </div>
          <div className={`text-[11px] font-medium mt-0.5 ${report.isVFR ? 'text-amber-400' : 'text-emerald-400'}`}>
            {report.isVFR ? 'VFR (متغير — خطر لاج)' : 'CFR (ثابت)'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 mb-1">معدل البت والحجم</div>
          <div className="font-mono text-sm font-semibold text-zinc-100">
            {formatBitrate(report.bitrateKbps)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">{formatSize(report.fileSizeBytes)}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 mb-1">المدة والترميز</div>
          <div className="font-mono text-sm font-semibold text-zinc-100">
            {report.durationSeconds.toFixed(1)} ثانية
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{report.codec}</div>
        </div>
      </div>

      {/* Lag Risk & Stability Assessment Banner */}
      <div
        className={`p-4 rounded-xl border flex items-start gap-3.5 ${
          report.lagRiskScore === 'high'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            : report.lagRiskScore === 'medium'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
        }`}
      >
        <Cpu className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-xs font-semibold">
            تقييم استقرار الفيديو وخطر التقطيع (Lag Risk):{' '}
            <span className="underline">
              {report.lagRiskScore === 'high' ? 'مرتفع' : report.lagRiskScore === 'medium' ? 'متوسط' : 'سليم ومنخفض'}
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {report.lagRiskDetails}
          </p>
        </div>
      </div>

      {/* Detected Technical Issues */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>الملاحظات الفنية المكتشفة في الملف</span>
        </h4>

        <div className="space-y-2">
          {report.technicalIssues.map((issue, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
              <span>{issue}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Fixes & Solutions */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>الإجراءات الفنية المقترحة والحلول التلقائية</span>
        </h4>

        <div className="space-y-2">
          {report.actionableRecommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>

        {onApplyRecommendedFixes && (
          <div className="pt-2">
            <button
              onClick={onApplyRecommendedFixes}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition"
            >
              تطبيق الإعدادات المقترحة على المحرر
            </button>
          </div>
        )}
      </div>

      {/* Honest Originality & TikTok Policy Disclaimer */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold">
          <HelpCircle className="w-4 h-4 text-rose-400" />
          <span>التمييز بين الإصلاح الفني وضمان التوصية</span>
        </div>
        <p className="leading-relaxed">
          {report.originalityNotes}
        </p>
      </div>
    </div>
  );
};
