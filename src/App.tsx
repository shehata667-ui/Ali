import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VideoUploader } from './components/VideoUploader';
import { StudioWorkspace } from './components/StudioWorkspace';
import { TechnicalReportView } from './components/TechnicalReportView';
import { FramingAndQualityEditor } from './components/FramingAndQualityEditor';
import { WatermarkEditor } from './components/WatermarkEditor';
import { BatchProcessingModal } from './components/BatchProcessingModal';
import { ExportedVideosView } from './components/ExportedVideosView';
import { AuthenticityAdvisor } from './components/AuthenticityAdvisor';
import { ApkDownloadModal } from './components/ApkDownloadModal';
import { ApkCenterTab } from './components/ApkCenterTab';
import { downloadApkFile } from './services/apkDownloader';
import { BatchJob, ExportedVideo, ProcessingSettings, VideoFileItem } from './types';
import { processVideo, ProcessingController } from './services/videoProcessor';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Plus, Play, Sparkles, Layers, Search, Sliders, Smartphone, Download } from 'lucide-react';

export default function App() {
  const { isInstallable, isInstalled } = usePWAInstall();

  // App State
  const [videos, setVideos] = useState<VideoFileItem[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('studio');
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [inspectorVideo, setInspectorVideo] = useState<VideoFileItem | null>(null);

  // Exported Videos state
  const [exportedVideos, setExportedVideos] = useState<ExportedVideo[]>([]);

  // Processing Settings
  const [settings, setSettings] = useState<ProcessingSettings>(() => {
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('tiktok_studio_last_username') : null;
    return {
      targetWidth: 1080,
      targetHeight: 1920,
      targetFps: 30,
      framingMode: 'blur-background',
      panX: 0,
      panY: 0,
      blurIntensity: 24,
      rotation: 0,
      qualityPreset: 'balanced',
      videoBitrateKbps: 5500,
      audioBitrateKbps: 192,
      forceCFR: true,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      volume: 100,
      isMuted: false,
      trimStartSeconds: 0,
      trimEndSeconds: 0,
      stripMetadata: true,
      watermark: {
        enabledText: true,
        text: savedUser || '@tiktok_creator',
        fontSize: 32,
        textColor: '#ffffff',
        textOpacity: 0.9,
        hasShadow: true,
        textXPercent: 50,
        textYPercent: 88,
        enabledLogo: false,
        logoWidthPercent: 20,
        logoOpacity: 0.85,
        logoXPercent: 80,
        logoYPercent: 14
      }
    };
  });

  // Batch Execution State
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Active Controller ref for cancelling
  const currentControllerRef = useRef<ProcessingController | null>(null);

  const activeVideo = videos.find((v) => v.id === activeVideoId) || videos[0];

  // Keep inspector video in sync
  useEffect(() => {
    if (!inspectorVideo && activeVideo) {
      setInspectorVideo(activeVideo);
    }
  }, [activeVideo]);

  // Video Management Handlers
  const handleAddVideos = (newVideos: VideoFileItem[]) => {
    setVideos((prev) => [...prev, ...newVideos]);
    if (!activeVideoId && newVideos.length > 0) {
      setActiveVideoId(newVideos[0].id);
      setInspectorVideo(newVideos[0]);
    }
  };

  const handleRemoveVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    if (activeVideoId === id) {
      const remaining = videos.filter((v) => v.id !== id);
      setActiveVideoId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const handleToggleSelectForBatch = (id: string) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, selectedForBatch: !v.selectedForBatch } : v))
    );
  };

  const handleSelectAllBatch = (select: boolean) => {
    setVideos((prev) => prev.map((v) => ({ ...v, selectedForBatch: select })));
  };

  const handleOpenInspectorForVideo = (video: VideoFileItem) => {
    setInspectorVideo(video);
    setActiveTab('inspector');
  };

  // Execution: Single Video Export
  const handleStartSingleExport = async (targetVideo?: VideoFileItem) => {
    const vid = targetVideo || activeVideo;
    if (!vid) return;

    const singleJob: BatchJob = {
      video: vid,
      status: 'processing',
      progress: 0,
      currentFps: settings.targetFps,
      framesProcessed: 0,
      totalFrames: Math.round(vid.duration * settings.targetFps),
      elapsedSeconds: 0,
      remainingSeconds: Math.round(vid.duration)
    };

    setBatchJobs([singleJob]);
    setCurrentJobIndex(0);
    setIsBatchModalOpen(true);
    setIsBatchProcessing(true);

    try {
      const { promise, controller } = processVideo(vid, settings, (stats) => {
        setBatchJobs((prev) =>
          prev.map((j, i) =>
            i === 0
              ? {
                  ...j,
                  progress: stats.progress,
                  currentFps: stats.currentFps,
                  framesProcessed: stats.framesProcessed,
                  totalFrames: stats.totalFrames,
                  elapsedSeconds: stats.elapsedSeconds,
                  remainingSeconds: stats.remainingSeconds
                }
              : j
          )
        );
      });

      currentControllerRef.current = controller;
      const exported = await promise;

      setExportedVideos((prev) => [exported, ...prev]);
      setBatchJobs((prev) =>
        prev.map((j, i) => (i === 0 ? { ...j, status: 'completed', result: exported } : j))
      );
    } catch (err: any) {
      console.error('Export failed:', err);
      setBatchJobs((prev) =>
        prev.map((j, i) =>
          i === 0 ? { ...j, status: 'failed', error: err?.message || 'فشلت المعالجة' } : j
        )
      );
    } finally {
      setIsBatchProcessing(false);
      currentControllerRef.current = null;
    }
  };

  // Execution: Batch Sequential Processing
  const handleStartBatchProcess = async () => {
    const selected = videos.filter((v) => v.selectedForBatch);
    if (selected.length === 0) {
      alert('يرجى تحديد فيديو واحد على الأقل للمعالجة الجماعية.');
      return;
    }

    const jobs: BatchJob[] = selected.map((v) => ({
      video: v,
      status: 'idle',
      progress: 0,
      currentFps: settings.targetFps,
      framesProcessed: 0,
      totalFrames: Math.round(v.duration * settings.targetFps),
      elapsedSeconds: 0,
      remainingSeconds: Math.round(v.duration)
    }));

    setBatchJobs(jobs);
    setCurrentJobIndex(0);
    setIsBatchModalOpen(true);
    setIsBatchProcessing(true);

    for (let i = 0; i < jobs.length; i++) {
      setCurrentJobIndex(i);
      setBatchJobs((prev) =>
        prev.map((j, idx) => (idx === i ? { ...j, status: 'processing' } : j))
      );

      try {
        const { promise, controller } = processVideo(jobs[i].video, settings, (stats) => {
          setBatchJobs((prev) =>
            prev.map((j, idx) =>
              idx === i
                ? {
                    ...j,
                    progress: stats.progress,
                    currentFps: stats.currentFps,
                    framesProcessed: stats.framesProcessed,
                    totalFrames: stats.totalFrames,
                    elapsedSeconds: stats.elapsedSeconds,
                    remainingSeconds: stats.remainingSeconds
                  }
                : j
            )
          );
        });

        currentControllerRef.current = controller;
        const exported = await promise;

        setExportedVideos((prev) => [exported, ...prev]);
        setBatchJobs((prev) =>
          prev.map((j, idx) => (idx === i ? { ...j, status: 'completed', result: exported } : j))
        );
      } catch (err: any) {
        console.error(`Job ${i} failed:`, err);
        setBatchJobs((prev) =>
          prev.map((j, idx) =>
            idx === i ? { ...j, status: 'failed', error: err?.message || 'فشلت المعالجة' } : j
          )
        );
      }
    }

    setIsBatchProcessing(false);
    currentControllerRef.current = null;
  };

  const handleCancelBatch = () => {
    if (currentControllerRef.current) {
      currentControllerRef.current.cancel();
      currentControllerRef.current = null;
    }
    setBatchJobs((prev) =>
      prev.map((j) => (j.status === 'processing' ? { ...j, status: 'cancelled' } : j))
    );
    setIsBatchProcessing(false);
  };

  const handleDeleteExported = (id: string) => {
    setExportedVideos((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        exportedCount={exportedVideos.length}
      />

      {/* Persistent APK Top Alert Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-b border-rose-500/50 py-3 px-4 text-center text-xs text-white flex flex-wrap items-center justify-center gap-3 shadow-lg">
        <span className="font-bold flex items-center gap-1.5 text-rose-200">
          <Smartphone className="w-4 h-4 text-rose-400 shrink-0" />
          <span>هل تبحث عن ملف الـ APK لتثبيته على هاتفك؟</span>
        </span>
        <button
          onClick={() => downloadApkFile('TikTokStudio.apk')}
          className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold transition shadow-md flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>اضغط هنا لتنزيل TikTokStudio.apk فوراً</span>
        </button>
        <button
          onClick={() => setActiveTab('apk')}
          className="underline hover:text-rose-200 transition font-medium"
        >
          أو افتح مركز التحميل الكامل وشاهد خطوات التثبيت 👈
        </button>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Dedicated Tab: APK Download Center */}
        {activeTab === 'apk' && (
          <ApkCenterTab />
        )}
        {/* Tab 1: Studio & Preview */}
        {activeTab === 'studio' && (
          <div className="space-y-8">
            {/* Top Workspace with Phone Mockup */}
            {activeVideo ? (
              <StudioWorkspace
                video={activeVideo}
                settings={settings}
                onUpdateSettings={setSettings}
                onOpenInspector={() => {
                  setInspectorVideo(activeVideo);
                  setActiveTab('inspector');
                }}
                onStartExport={() => handleStartSingleExport(activeVideo)}
                isExporting={isBatchProcessing}
              />
            ) : null}

            {/* Video Selection Grid & Multi-File Picker */}
            <div className="pt-4 border-t border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    مكتبة الفيديوهات المحددة
                  </h3>
                  <p className="text-xs text-zinc-400">
                    اضغط على أي فيديو لمعاينته أو حدد عدة ملفات للمعالجة الجماعية.
                  </p>
                </div>

                {videos.length > 0 && (
                  <button
                    onClick={handleStartBatchProcess}
                    disabled={isBatchProcessing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition"
                  >
                    <Layers className="w-4 h-4" />
                    <span>معالجة الدُفعة المحددة ({videos.filter((v) => v.selectedForBatch).length})</span>
                  </button>
                )}
              </div>

              <VideoUploader
                videos={videos}
                onAddVideos={handleAddVideos}
                onSelectActiveVideo={(vid) => {
                  setActiveVideoId(vid.id);
                  setInspectorVideo(vid);
                }}
                activeVideoId={activeVideo?.id}
                onToggleSelectForBatch={handleToggleSelectForBatch}
                onSelectAllBatch={handleSelectAllBatch}
                onRemoveVideo={handleRemoveVideo}
                onOpenInspectorForVideo={handleOpenInspectorForVideo}
                onStartSingleProcess={handleStartSingleExport}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Technical Inspector & Report */}
        {activeTab === 'inspector' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-100">
                  الفحص الفني الدقيق وتقييم اللاج
                </h2>
                <p className="text-xs text-zinc-400">
                  فحص حقيقي لمعدل الإطارات VFR، الأشرطة السوداء، والعلامات المائية المحتملة
                </p>
              </div>

              {videos.length > 1 && (
                <select
                  value={inspectorVideo?.id || ''}
                  onChange={(e) => {
                    const found = videos.find((v) => v.id === e.target.value);
                    if (found) setInspectorVideo(found);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
                >
                  {videos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {inspectorVideo ? (
              <TechnicalReportView
                video={inspectorVideo}
                onApplyRecommendedFixes={() => {
                  setSettings((s) => ({
                    ...s,
                    framingMode: 'blur-background',
                    targetWidth: 1080,
                    targetHeight: 1920,
                    targetFps: 30,
                    forceCFR: true
                  }));
                  setActiveTab('studio');
                }}
              />
            ) : (
              <div className="py-12 text-center text-zinc-400 text-xs">
                يرجى رفع فيديو أولاً لعرض التقرير الفني.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Framing 9:16 & Quality Settings */}
        {activeTab === 'framing' && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-zinc-100">
                إعدادات المقاس 9:16 وضغط الجودة
              </h2>
              <p className="text-xs text-zinc-400">
                ضبط أبعاد TikTok ومعدل البت وتثبيت معدل الإطارات (CFR) لمنع التقطيع
              </p>
            </div>

            <FramingAndQualityEditor
              settings={settings}
              onUpdateSettings={setSettings}
              activeVideo={activeVideo}
            />
          </div>
        )}

        {/* Tab 4: Watermark & Identity */}
        {activeTab === 'watermark' && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-zinc-100">
                العلامة المائية وهوية صانع المحتوى
              </h2>
              <p className="text-xs text-zinc-400">
                إضافة اسم المستخدم والشعار مع دمج حقيقي داخل إطارات الفيديو
              </p>
            </div>

            <WatermarkEditor
              settings={settings}
              onUpdateSettings={setSettings}
            />
          </div>
        )}

        {/* Tab 5: Batch Processing Queue */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-100">
                  قائمة المعالجة الجماعية
                </h2>
                <p className="text-xs text-zinc-400">
                  تجهيز عدة فيديوهات بالتتابع مع حفظ موارد الهاتف وتجنب استهلاك الذاكرة
                </p>
              </div>

              <button
                onClick={handleStartBatchProcess}
                disabled={isBatchProcessing || videos.filter((v) => v.selectedForBatch).length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>بدء معالجة الفيديوهات المحددة</span>
              </button>
            </div>

            {videos.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                لا توجد فيديوهات في القائمة حاليًا. قم باختيار فيديوهات من تبويب الاستوديو.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-zinc-400 px-1">
                  <span>الفيديوهات المحددة للمعالجة: {videos.filter((v) => v.selectedForBatch).length} من {videos.length}</span>
                </div>
                <div className="space-y-2">
                  {videos.map((vid) => (
                    <div
                      key={vid.id}
                      className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleSelectForBatch(vid.id)}
                          className="text-zinc-400 hover:text-white"
                        >
                          {vid.selectedForBatch ? (
                            <span className="w-4 h-4 rounded bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                          ) : (
                            <span className="w-4 h-4 rounded border border-zinc-600 inline-block" />
                          )}
                        </button>
                        <div>
                          <div className="font-semibold text-zinc-200">{vid.name}</div>
                          <div className="text-[11px] text-zinc-500">
                            {vid.width}×{vid.height} · {vid.aspectRatio} · {(vid.duration).toFixed(1)} ثانية
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartSingleExport(vid)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white"
                      >
                        معالجة منفردة
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Exported Videos & Comparison */}
        {activeTab === 'exported' && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-zinc-100">
                الفيديوهات المنجزة والمعاينة
              </h2>
              <p className="text-xs text-zinc-400">
                معاينة المقاطع الناتجة بمقاس 9:16 وفحص التزامن والتنزيل المباشر
              </p>
            </div>

            <ExportedVideosView
              exportedVideos={exportedVideos}
              sourceVideos={videos}
              onDeleteExported={handleDeleteExported}
            />
          </div>
        )}

        {/* Tab 7: Authenticity & FYP Advisor */}
        {activeTab === 'authenticity' && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-zinc-100">
                دليل خوارزمية تيك توك والأصالة (FYP Advisor)
              </h2>
              <p className="text-xs text-zinc-400">
                إرشادات عملية لزيادة فرص التوصية والوصول إلى صفحة لك (For You)
              </p>
            </div>

            <AuthenticityAdvisor />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 text-center text-xs text-zinc-500 space-y-2">
        <p>TikTok Video Studio — استوديو متكامل لتجهيز الفيديوهات الرأسية 9:16 مع تحويل الإطارات الثابتة</p>
        <p className="text-[11px] text-zinc-600">
          معالجة محلية آمنة على جهازك دون رفع الملفات إلى أي خوادم خارجية لحفظ الخصوصية والسرعة.
        </p>
      </footer>

      {/* Batch Processing Dialog Modal */}
      <BatchProcessingModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        jobs={batchJobs}
        currentJobIndex={currentJobIndex}
        isProcessing={isBatchProcessing}
        onCancelBatch={handleCancelBatch}
      />

      {/* APK & Android Installation Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
    </div>
  );
}
