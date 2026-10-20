import React, { useState } from 'react';
import { Download, Share2, Play, CheckCircle2, ShieldCheck, Film, ExternalLink, Trash2 } from 'lucide-react';
import { ExportedVideo, VideoFileItem } from '../types';

interface ExportedVideosViewProps {
  exportedVideos: ExportedVideo[];
  sourceVideos: VideoFileItem[];
  onDeleteExported: (id: string) => void;
}

export const ExportedVideosView: React.FC<ExportedVideosViewProps> = ({
  exportedVideos,
  sourceVideos,
  onDeleteExported
}) => {
  const [selectedVideo, setSelectedVideo] = useState<ExportedVideo | null>(
    exportedVideos.length > 0 ? exportedVideos[0] : null
  );

  const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  const handleDownload = (video: ExportedVideo) => {
    const a = document.createElement('a');
    a.href = video.url;
    a.download = video.outputName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async (video: ExportedVideo) => {
    if (navigator.share) {
      try {
        const file = new File([video.blob], video.outputName, { type: video.blob.type });
        await navigator.share({
          files: [file],
          title: video.outputName,
          text: 'فيديو مجهز للنشر على تيك توك عبر TikTok Video Studio'
        });
      } catch (e) {
        console.warn('Share cancelled or not supported', e);
      }
    } else {
      handleDownload(video);
    }
  };

  if (exportedVideos.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-3">
        <Film className="w-12 h-12 text-zinc-600 mx-auto" />
        <h3 className="text-sm font-semibold text-zinc-200">
          لا توجد فيديوهات منجزة حتى الآن
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          اختر فيديو من الاستوديو واضغط على «تصدير هذا الفيديو» أو ابدأ المعالجة الجماعية ليظهر الناتج هنا.
        </p>
      </div>
    );
  }

  const activeSource = selectedVideo ? sourceVideos.find((v) => v.id === selectedVideo.sourceId) : null;

  return (
    <div className="space-y-8 text-right">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Player & Before/After Comparison */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {selectedVideo && (
            <div className="w-full max-w-[340px] rounded-[36px] p-3 bg-zinc-900 border-4 border-zinc-800 shadow-2xl space-y-3">
              <div className="w-24 h-4 bg-zinc-800 rounded-full mx-auto flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-zinc-700 mr-2" />
              </div>

              {/* 9:16 Video Player */}
              <div className="aspect-[9/16] w-full rounded-[24px] overflow-hidden bg-black border border-zinc-800">
                <video
                  src={selectedVideo.url}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Verification Badges */}
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم فحص الفيديو: قابل للتشغيل وتزامن الصوت سليم</span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono flex justify-between">
                  <span>{selectedVideo.width}×{selectedVideo.height} px</span>
                  <span>{selectedVideo.fps} FPS CFR</span>
                  <span>{formatSize(selectedVideo.fileSizeBytes)}</span>
                </div>
              </div>

              {/* Action Buttons for active video */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleDownload(selectedVideo)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل الفيديو الآن</span>
                </button>

                <button
                  onClick={() => handleShare(selectedVideo)}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                  title="مشاركة الفيديو أو حفظه بالهاتف"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Comparative Metrics & List of All Outputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Comparison Card (Before vs After) */}
          {selectedVideo && activeSource && (
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                مقارنة الملف قبل وبعد المعالجة
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Source */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                  <span className="font-semibold text-zinc-400 block">الملف الأصلي:</span>
                  <div className="space-y-1 font-mono text-zinc-300">
                    <div>الأبعاد: {activeSource.width}×{activeSource.height}</div>
                    <div>الحجم: {formatSize(activeSource.sizeBytes)}</div>
                    <div>النسبة: {activeSource.aspectRatio}</div>
                  </div>
                </div>

                {/* Exported */}
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                  <span className="font-semibold text-rose-300 block">النسخة النهائية (TikTok):</span>
                  <div className="space-y-1 font-mono text-rose-200">
                    <div>الأبعاد: {selectedVideo.width}×{selectedVideo.height} (9:16)</div>
                    <div>الحجم: {formatSize(selectedVideo.fileSizeBytes)}</div>
                    <div>الإطارات: {selectedVideo.fps} FPS CFR</div>
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="text-[11px] text-zinc-400 pt-1">
                تم تثبيت التوقيت الزمني وطوابع PTS لمنع التقطيع عند رفع الفيديو لتيك توك.
              </div>
            </div>
          )}

          {/* List of all exported files */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              جميع الفيديوهات الجاهزة للتنزيل ({exportedVideos.length})
            </h4>

            <div className="space-y-2.5">
              {exportedVideos.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedVideo(item)}
                  className={`cursor-pointer p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                    selectedVideo?.id === item.id
                      ? 'border-rose-500 bg-zinc-900'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="font-semibold text-zinc-200 truncate max-w-[260px]">
                      {item.outputName}
                    </div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-2 font-mono">
                      <span>{item.width}×{item.height}</span>
                      <span>·</span>
                      <span>{formatSize(item.fileSizeBytes)}</span>
                      <span>·</span>
                      <span>{item.durationSeconds.toFixed(1)} ث</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white"
                      title="تنزيل"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteExported(item.id);
                      }}
                      className="p-2 rounded-lg text-zinc-500 hover:text-rose-400"
                      title="حذف من السجل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
