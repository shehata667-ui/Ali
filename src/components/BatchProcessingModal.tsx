import React from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, StopCircle, Cpu, Clock, Layers } from 'lucide-react';
import { BatchJob } from '../types';

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: BatchJob[];
  currentJobIndex: number;
  isProcessing: boolean;
  onCancelBatch: () => void;
}

export const BatchProcessingModal: React.FC<BatchProcessingModalProps> = ({
  isOpen,
  onClose,
  jobs,
  currentJobIndex,
  isProcessing,
  onCancelBatch
}) => {
  if (!isOpen) return null;

  const currentJob = jobs[currentJobIndex];
  const completedJobsCount = jobs.filter((j) => j.status === 'completed').length;
  const overallProgress = jobs.length > 0 ? Math.round((completedJobsCount / jobs.length) * 100) : 0;

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 text-right space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                طابور المعالجة الجماعية للفيديوهات
              </h3>
              <p className="text-xs text-zinc-400">
                معالجة متتابعة CFR لمنع اختناق الذاكرة والتقطيع
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-300">
            <span>التقدم الإجمالي للدُفعة</span>
            <span className="font-mono text-rose-400 font-semibold">{overallProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="text-[11px] text-zinc-500 flex justify-between">
            <span>اكتمل {completedJobsCount} من أصل {jobs.length} فيديوهات</span>
            <span>المعالج الحالي: {Math.min(currentJobIndex + 1, jobs.length)} / {jobs.length}</span>
          </div>
        </div>

        {/* Current Active Video Live Telemetry */}
        {currentJob && currentJob.status === 'processing' && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 truncate max-w-[280px]">
                {currentJob.video.name}
              </span>
              <span className="font-mono text-rose-400 font-bold">{currentJob.progress}%</span>
            </div>

            {/* Current Video Mini Progress */}
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all duration-150"
                style={{ width: `${currentJob.progress}%` }}
              />
            </div>

            {/* Live Stats Strip */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentJob.currentFps} FPS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>متبقي: {formatSec(currentJob.remainingSeconds)}</span>
              </div>
              <div className="text-left text-zinc-500">
                <span>{currentJob.framesProcessed} إطار</span>
              </div>
            </div>
          </div>
        )}

        {/* Jobs List */}
        <div className="max-h-56 overflow-y-auto space-y-2 pr-1 no-scrollbar">
          {jobs.map((job, idx) => (
            <div
              key={job.video.id}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                job.status === 'processing'
                  ? 'border-rose-500/50 bg-rose-500/5'
                  : 'border-zinc-800 bg-zinc-950/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-zinc-500 text-[11px] shrink-0">#{idx + 1}</span>
                <span className="truncate font-medium text-zinc-200">{job.video.name}</span>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {job.status === 'processing' && (
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{job.progress}%</span>
                  </div>
                )}
                {job.status === 'completed' && (
                  <div className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اكتمل بنجاح</span>
                  </div>
                )}
                {job.status === 'failed' && (
                  <div className="flex items-center gap-1 text-rose-400 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>فشل</span>
                  </div>
                )}
                {job.status === 'cancelled' && (
                  <span className="text-zinc-500">تم الإلغاء</span>
                )}
                {job.status === 'idle' && (
                  <span className="text-zinc-500">في الانتظار</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Thermal / Resource Advisory */}
        <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>المعالجة خارج الخيط الرئيسي (Offscreen Canvas Stream) لضمان عدم تجمد الشاشة.</span>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          {isProcessing ? (
            <button
              onClick={onCancelBatch}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-semibold transition"
            >
              <StopCircle className="w-4 h-4" />
              <span>إلغاء المعالجة وتحرير الذاكرة</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
            >
              إغلاق ومتابعة النتائج
            </button>
          )}

          <span className="text-[11px] text-zinc-500">
            لا يتم حذف أو تعديل الفيديوهات الأصلية
          </span>
        </div>
      </div>
    </div>
  );
};
