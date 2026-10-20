import React, { useRef, useState } from 'react';
import { Upload, FileVideo, Plus, CheckSquare, Square, Trash2, Search, Play, Sparkles, Loader2 } from 'lucide-react';
import { VideoFileItem } from '../types';
import { analyzeVideoFile } from '../services/videoInspector';
import { createSampleVideo } from '../services/sampleVideoGenerator';

interface VideoUploaderProps {
  videos: VideoFileItem[];
  onAddVideos: (newVideos: VideoFileItem[]) => void;
  onSelectActiveVideo: (video: VideoFileItem) => void;
  activeVideoId?: string;
  onToggleSelectForBatch: (id: string) => void;
  onSelectAllBatch: (select: boolean) => void;
  onRemoveVideo: (id: string) => void;
  onOpenInspectorForVideo: (video: VideoFileItem) => void;
  onStartSingleProcess: (video: VideoFileItem) => void;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  videos,
  onAddVideos,
  onSelectActiveVideo,
  activeVideoId,
  onToggleSelectForBatch,
  onSelectAllBatch,
  onRemoveVideo,
  onOpenInspectorForVideo,
  onStartSingleProcess
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsLoadingFiles(true);
    const newItems: VideoFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|webm|mkv|avi|m4v)$/i)) {
        continue;
      }

      setLoadingStatus(`جاري فحص واستخراج بيانات ${file.name} (${i + 1}/${files.length})...`);

      try {
        const { report, item } = await analyzeVideoFile(file);
        const videoItem: VideoFileItem = {
          id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          file,
          name: file.name,
          sizeBytes: file.size,
          url: URL.createObjectURL(file),
          thumbnailUrl: item.thumbnailUrl || '',
          duration: item.duration || 0,
          width: item.width || 0,
          height: item.height || 0,
          aspectRatio: item.aspectRatio || `${item.width}:${item.height}`,
          fps: item.fps || 30,
          bitrateKbps: item.bitrateKbps || 0,
          mimeType: item.mimeType || file.type,
          hasAudio: true,
          selectedForBatch: true,
          report
        };
        newItems.push(videoItem);
      } catch (err) {
        console.error('Failed to parse video file:', file.name, err);
      }
    }

    if (newItems.length > 0) {
      onAddVideos(newItems);
      if (!activeVideoId) {
        onSelectActiveVideo(newItems[0]);
      }
    }

    setIsLoadingFiles(false);
    setLoadingStatus('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleCreateSample = async () => {
    setIsLoadingFiles(true);
    setLoadingStatus('جاري توليد فيديو اختباري ذكي بأبعاد 16:9 وصوت متزامن...');
    try {
      const sampleFile = await createSampleVideo();
      await handleFiles([sampleFile]);
    } catch (err) {
      console.error('Failed to generate sample video:', err);
    } finally {
      setIsLoadingFiles(false);
      setLoadingStatus('');
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  };

  const allSelected = videos.length > 0 && videos.every((v) => v.selectedForBatch);

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? 'border-rose-500 bg-rose-500/10'
            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              اسحب الفيديوهات هنا أو اضغط للاختيار من الهاتف
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              يدعم MP4 و WebM و MOV حتى دقة 4K · يمكنك اختيار فيديو واحد أو عدة فيديوهات معًا
            </p>
          </div>
        </div>
      </div>

      {/* Action Strip: Quick Sample generator & Batch Selection */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateSample}
            disabled={isLoadingFiles}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>توليد فيديو تجريبي 16:9 جاهز للاختبار</span>
          </button>
          {videos.length > 0 && (
            <button
              onClick={() => onSelectAllBatch(!allSelected)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
            >
              {allSelected ? <CheckSquare className="w-4 h-4 text-rose-400" /> : <Square className="w-4 h-4" />}
              <span>{allSelected ? 'إلغاء تحديد الكل' : 'تحديد جميع الفيديوهات للمعالجة'}</span>
            </button>
          )}
        </div>

        {videos.length > 0 && (
          <div className="text-xs text-zinc-500">
            <span>إجمالي الملفات: {videos.length}</span>
            <span className="mx-1.5">·</span>
            <span className="text-rose-400 font-medium">المحدد للدُفعة: {videos.filter((v) => v.selectedForBatch).length}</span>
          </div>
        )}
      </div>

      {/* Loading Status Indicator */}
      {isLoadingFiles && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
          <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
          <span>{loadingStatus}</span>
        </div>
      )}

      {/* Videos Grid / List */}
      {videos.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-zinc-800/80 bg-zinc-950/40">
          <FileVideo className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h4 className="text-sm font-medium text-zinc-300">لم يتم اختيار أي فيديو بعد</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            قم برفع فيديوهاتك أو اضغط على «توليد فيديو تجريبي» لبدء الفحص وضبط أبعاد 9:16 فورًا.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((vid) => {
            const isActive = vid.id === activeVideoId;
            const hasLagRisk = vid.report?.lagRiskScore === 'high';
            const isHorizontal = vid.width > vid.height;

            return (
              <div
                key={vid.id}
                className={`group relative rounded-xl border p-3.5 transition-all ${
                  isActive
                    ? 'border-rose-500 bg-zinc-900/90 shadow-md shadow-rose-500/10'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                {/* Header row with checkbox & remove */}
                <div className="flex items-center justify-between mb-2.5">
                  <button
                    onClick={() => onToggleSelectForBatch(vid.id)}
                    className="flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white"
                  >
                    {vid.selectedForBatch ? (
                      <CheckSquare className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-500" />
                    )}
                    <span className="truncate max-w-[180px] font-semibold">{vid.name}</span>
                  </button>

                  <button
                    onClick={() => onRemoveVideo(vid.id)}
                    className="text-zinc-500 hover:text-rose-400 transition p-1"
                    title="حذف الفيديو من القائمة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Thumbnail & Video Specs */}
                <div
                  onClick={() => onSelectActiveVideo(vid)}
                  className="cursor-pointer flex gap-3 items-center rounded-lg p-2 bg-zinc-950/60 border border-zinc-800/80 hover:bg-zinc-950 transition"
                >
                  <div className="relative w-20 h-24 rounded-md overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                    {vid.thumbnailUrl ? (
                      <img
                        src={vid.thumbnailUrl}
                        alt={vid.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <FileVideo className="w-6 h-6" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 text-[10px] font-mono px-1 py-0.5 rounded bg-black/80 text-white">
                      {formatDuration(vid.duration)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                    {/* Metadata zero-pill clean text */}
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                      <span>{vid.width}×{vid.height}</span>
                      <span aria-hidden="true">·</span>
                      <span>{vid.aspectRatio}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{vid.fps} FPS</span>
                    </div>

                    <div className="text-[11px] text-zinc-500">
                      <span>{formatSize(vid.sizeBytes)}</span>
                      <span className="mx-1">·</span>
                      <span className="font-mono tabular-nums">{Math.round(vid.bitrateKbps)} Kbps</span>
                    </div>

                    {/* Status note */}
                    <div className="text-[11px] pt-1">
                      {isHorizontal ? (
                        <span className="text-amber-400">أفقي 16:9 — يتطلب 9:16</span>
                      ) : (
                        <span className="text-emerald-400">عمودي 9:16 جاهز</span>
                      )}
                      {hasLagRisk && (
                        <span className="text-rose-400 mr-2">· خطر تقطيع VFR</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons for this card */}
                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={() => onOpenInspectorForVideo(vid)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
                  >
                    <Search className="w-3.5 h-3.5 text-cyan-400" />
                    <span>تقرير الفحص واللاج</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectActiveVideo(vid);
                      onStartSingleProcess(vid);
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600/90 text-white hover:bg-rose-500 transition shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>معالجة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
