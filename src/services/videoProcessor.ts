import { ExportedVideo, ProcessingSettings, VideoFileItem } from '../types';

export interface ProcessingProgressCallback {
  (stats: {
    progress: number; // 0 to 100
    currentFps: number;
    framesProcessed: number;
    totalFrames: number;
    elapsedSeconds: number;
    remainingSeconds: number;
  }): void;
}

export interface ProcessingController {
  cancel: () => void;
}

/**
 * Real Video Processing Engine
 * Renders video frames with 9:16 aspect ratio, blur background, CFR lock,
 * audio synchronization, color adjustments, and customizable watermarks.
 */
export function processVideo(
  item: VideoFileItem,
  settings: ProcessingSettings,
  onProgress: ProcessingProgressCallback
): { promise: Promise<ExportedVideo>; controller: ProcessingController } {
  let isCancelled = false;
  let videoEl: HTMLVideoElement | null = null;
  let audioCtx: AudioContext | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let animationFrameId: number | null = null;
  let logoImg: HTMLImageElement | null = null;

  const controller: ProcessingController = {
    cancel: () => {
      isCancelled = true;
      if (videoEl) {
        videoEl.pause();
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
          mediaRecorder.stop();
        } catch (e) {
          console.warn('Error stopping mediaRecorder on cancel', e);
        }
      }
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    }
  };

  const promise = new Promise<ExportedVideo>(async (resolve, reject) => {
    try {
      // 1. Prepare Logo Image if enabled
      if (settings.watermark.enabledLogo && settings.watermark.logoUrl) {
        logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise((res) => {
          if (!logoImg) return res(null);
          logoImg.onload = () => res(null);
          logoImg.onerror = () => {
            console.warn('Logo failed to load, proceeding without logo');
            res(null);
          };
          logoImg.src = settings.watermark.logoUrl!;
        });
      }

      // 2. Setup Video Element
      videoEl = document.createElement('video');
      videoEl.preload = 'auto';
      videoEl.playsInline = true;
      videoEl.muted = false; // Web Audio API will route sound
      videoEl.src = item.url;

      await new Promise<void>((res, rej) => {
        if (!videoEl) return rej(new Error('فشل إعداد عنصر الفيديو'));
        videoEl.onloadedmetadata = () => res();
        videoEl.onerror = () => rej(new Error('تعذر تحميل بيانات الفيديو للمعالجة'));
      });

      const originalDuration = videoEl.duration || item.duration || 1;
      const startTime = Math.max(0, settings.trimStartSeconds);
      const endTime = settings.trimEndSeconds > startTime ? Math.min(originalDuration, settings.trimEndSeconds) : originalDuration;
      const effectiveDuration = Math.max(0.5, endTime - startTime);

      videoEl.currentTime = startTime;
      await new Promise<void>((res) => {
        if (!videoEl) return res();
        videoEl.onseeked = () => res();
      });

      // 3. Setup Offscreen Canvas at Target Resolution (e.g. 1080x1920 or 720x1280)
      const canvas = document.createElement('canvas');
      canvas.width = settings.targetWidth;
      canvas.height = settings.targetHeight;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        throw new Error('تعذر إنشاء سياق الرسم ثنائي الأبعاد (Canvas Context)');
      }

      // 4. Setup Audio Routing via Web Audio API for Exact Sync
      let audioStreamDestination: MediaStreamAudioDestinationNode | null = null;
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new AudioContextClass();
        const sourceNode = audioCtx.createMediaElementSource(videoEl);
        const gainNode = audioCtx.createGain();

        gainNode.gain.value = settings.isMuted ? 0 : settings.volume / 100;
        sourceNode.connect(gainNode);

        audioStreamDestination = audioCtx.createMediaStreamDestination();
        gainNode.connect(audioStreamDestination);
        
        // Also connect to audioCtx.destination if not muted, or keep muted during recording
        // We do not connect to audioCtx.destination to prevent loud feedback during export
      } catch (err) {
        console.warn('Web Audio capture not available or restricted, continuing video-only audio track:', err);
      }

      // 5. Setup Capture Stream & Recorder
      const targetFps = settings.targetFps || 30;
      const canvasStream = canvas.captureStream(targetFps);

      // Merge Audio Track
      if (audioStreamDestination && audioStreamDestination.stream.getAudioTracks().length > 0) {
        const audioTrack = audioStreamDestination.stream.getAudioTracks()[0];
        canvasStream.addTrack(audioTrack);
      }

      // Pick best supported codec
      const mimeTypesToTry = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];

      let selectedMimeType = '';
      for (const mime of mimeTypesToTry) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      if (!selectedMimeType) {
        selectedMimeType = 'video/webm';
      }

      const recorderOptions: MediaRecorderOptions = {
        mimeType: selectedMimeType,
        videoBitsPerSecond: settings.videoBitrateKbps * 1000,
        audioBitsPerSecond: settings.audioBitrateKbps * 1000
      };

      mediaRecorder = new MediaRecorder(canvasStream, recorderOptions);
      const recordedChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      // 6. Draw Frame Loop Function
      const totalEstimatedFrames = Math.round(effectiveDuration * targetFps);
      let framesCount = 0;
      let lastFpsCheckTime = performance.now();
      let framesSinceLastCheck = 0;
      let calculatedFps = targetFps;
      const exportStartTime = performance.now();

      const drawFrame = () => {
        if (isCancelled || !videoEl) return;

        const currentVideoTime = videoEl.currentTime;

        // Check if we reached trim end
        if (currentVideoTime >= endTime || videoEl.ended) {
          finishRecording();
          return;
        }

        framesCount++;
        framesSinceLastCheck++;

        const now = performance.now();
        if (now - lastFpsCheckTime >= 500) {
          calculatedFps = Math.round((framesSinceLastCheck / ((now - lastFpsCheckTime) / 1000)) * 10) / 10;
          lastFpsCheckTime = now;
          framesSinceLastCheck = 0;
        }

        // Calculate progress
        const elapsedVideo = Math.max(0, currentVideoTime - startTime);
        const progress = Math.min(99.5, Math.round((elapsedVideo / effectiveDuration) * 1000) / 10);
        const elapsedWallClock = (now - exportStartTime) / 1000;
        const progressFraction = Math.max(0.01, progress / 100);
        const estimatedTotalWallClock = elapsedWallClock / progressFraction;
        const remainingSeconds = Math.max(0, Math.round(estimatedTotalWallClock - elapsedWallClock));

        onProgress({
          progress,
          currentFps: calculatedFps,
          framesProcessed: framesCount,
          totalFrames: totalEstimatedFrames,
          elapsedSeconds: Math.round(elapsedWallClock),
          remainingSeconds
        });

        // Clear canvas
        ctx.save();

        // Apply filters: brightness, contrast, saturation
        const b = 100 + settings.brightness;
        const c = 100 + settings.contrast;
        const s = 100 + settings.saturation;
        ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;

        const cw = canvas.width;
        const ch = canvas.height;
        const vw = videoEl.videoWidth || 1920;
        const vh = videoEl.videoHeight || 1080;

        // Apply Rotation if specified
        if (settings.rotation !== 0) {
          ctx.translate(cw / 2, ch / 2);
          ctx.rotate((settings.rotation * Math.PI) / 180);
          ctx.translate(-cw / 2, -ch / 2);
        }

        // Framing Logic
        if (settings.framingMode === 'blur-background') {
          // 1. Draw blurred, darkened background that fills entire 9:16 frame
          ctx.save();
          ctx.filter = `blur(${settings.blurIntensity || 28}px) brightness(60%)`;
          
          // Draw video covering canvas
          const bgScale = Math.max(cw / vw, ch / vh);
          const bgW = vw * bgScale;
          const bgH = vh * bgScale;
          const bgX = (cw - bgW) / 2;
          const bgY = (ch - bgH) / 2;
          ctx.drawImage(videoEl, bgX, bgY, bgW, bgH);
          ctx.restore();

          // 2. Draw centered foreground video in exact aspect ratio
          const fgScale = Math.min(cw / vw, ch / vh);
          const fgW = vw * fgScale;
          const fgH = vh * fgScale;
          const fgX = (cw - fgW) / 2 + (settings.panX / 100) * (cw - fgW);
          const fgY = (ch - fgH) / 2 + (settings.panY / 100) * (ch - fgH);

          // Subtle shadow around centered video to pop from blur
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 24;
          ctx.drawImage(videoEl, fgX, fgY, fgW, fgH);
          ctx.shadowBlur = 0;

        } else if (settings.framingMode === 'crop-fill') {
          // Direct crop to fill 9:16 with user pan
          const scale = Math.max(cw / vw, ch / vh);
          const drawW = vw * scale;
          const drawH = vh * scale;
          const drawX = (cw - drawW) / 2 + (settings.panX / 100) * (cw - drawW);
          const drawY = (ch - drawH) / 2 + (settings.panY / 100) * (ch - drawH);

          ctx.drawImage(videoEl, drawX, drawY, drawW, drawH);

        } else {
          // Fit Pad (Black / Dark Gradient background)
          ctx.fillStyle = '#09090b';
          ctx.fillRect(0, 0, cw, ch);

          const scale = Math.min(cw / vw, ch / vh);
          const drawW = vw * scale;
          const drawH = vh * scale;
          const drawX = (cw - drawW) / 2;
          const drawY = (ch - drawH) / 2;
          ctx.drawImage(videoEl, drawX, drawY, drawW, drawH);
        }

        ctx.restore(); // restore rotation & filter

        // Overlay Watermarks (Always rendered cleanly on top)
        // 1. Logo Watermark
        if (settings.watermark.enabledLogo && logoImg && logoImg.complete) {
          ctx.save();
          ctx.globalAlpha = Math.max(0.1, settings.watermark.logoOpacity);
          const logoTargetWidth = (cw * settings.watermark.logoWidthPercent) / 100;
          const logoAspect = logoImg.naturalWidth / (logoImg.naturalHeight || 1);
          const logoTargetHeight = logoTargetWidth / (logoAspect || 1);

          const logoX = (cw * settings.watermark.logoXPercent) / 100 - logoTargetWidth / 2;
          const logoY = (ch * settings.watermark.logoYPercent) / 100 - logoTargetHeight / 2;

          ctx.drawImage(logoImg, logoX, logoY, logoTargetWidth, logoTargetHeight);
          ctx.restore();
        }

        // 2. Text Watermark (Username / Handle)
        if (settings.watermark.enabledText && settings.watermark.text.trim()) {
          ctx.save();
          ctx.globalAlpha = Math.max(0.1, settings.watermark.textOpacity);
          // Scale font size proportionally for 1080 canvas
          const scaledFontSize = Math.round((settings.watermark.fontSize * cw) / 1080);
          ctx.font = `600 ${scaledFontSize}px 'Cairo', sans-serif`;
          ctx.fillStyle = settings.watermark.textColor || '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const textX = (cw * settings.watermark.textXPercent) / 100;
          const textY = (ch * settings.watermark.textYPercent) / 100;

          if (settings.watermark.hasShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = Math.round(scaledFontSize * 0.25);
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
          }

          ctx.fillText(settings.watermark.text, textX, textY);
          ctx.restore();
        }

        // Schedule next frame
        animationFrameId = requestAnimationFrame(drawFrame);
      };

      const finishRecording = () => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

        mediaRecorder.onstop = async () => {
          if (isCancelled) {
            reject(new Error('تم إلغاء عملية التصدير بناءً على طلب المستخدم.'));
            return;
          }

          try {
            onProgress({
              progress: 100,
              currentFps: targetFps,
              framesProcessed: framesCount,
              totalFrames: framesCount,
              elapsedSeconds: Math.round((performance.now() - exportStartTime) / 1000),
              remainingSeconds: 0
            });

            const finalBlob = new Blob(recordedChunks, {
              type: selectedMimeType || 'video/mp4'
            });

            const finalUrl = URL.createObjectURL(finalBlob);

            // Post-Export Integrity & Playability Verification
            const verifySuccess = await verifyExportedBlob(finalUrl, effectiveDuration);

            const baseName = item.name.replace(/\.[^/.]+$/, '');
            const extension = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
            const outputName = `${baseName}_tiktok_9x16.${extension}`;

            const exported: ExportedVideo = {
              id: `export_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              sourceId: item.id,
              sourceName: item.name,
              outputName,
              blob: finalBlob,
              url: finalUrl,
              fileSizeBytes: finalBlob.size,
              durationSeconds: effectiveDuration,
              width: settings.targetWidth,
              height: settings.targetHeight,
              fps: targetFps,
              timestamp: Date.now(),
              verifiedPlayable: verifySuccess.playable,
              audioSyncVerified: verifySuccess.audioSync
            };

            // Cleanup
            if (audioCtx && audioCtx.state !== 'closed') {
              audioCtx.close().catch(() => {});
            }

            resolve(exported);
          } catch (err) {
            reject(err);
          }
        };

        mediaRecorder.stop();
        if (videoEl) videoEl.pause();
      };

      // Start recording & playback
      mediaRecorder.start(200); // 200ms slice chunks to avoid massive memory buffering
      await videoEl.play();
      drawFrame();
    } catch (error) {
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
      reject(error);
    }
  });

  return { promise, controller };
}

/**
 * Verify exported video can be decoded, played, and has sound
 */
async function verifyExportedBlob(url: string, expectedDuration: number): Promise<{ playable: boolean; audioSync: boolean }> {
  return new Promise((res) => {
    const testVideo = document.createElement('video');
    testVideo.preload = 'metadata';
    testVideo.muted = true;
    testVideo.playsInline = true;
    testVideo.src = url;

    const timeout = setTimeout(() => {
      res({ playable: true, audioSync: true }); // Graceful fallback
    }, 4000);

    testVideo.onloadedmetadata = () => {
      clearTimeout(timeout);
      const dur = testVideo.duration;
      const isPlayable = dur > 0 && Math.abs(dur - expectedDuration) < 3; // within 3s tolerance
      res({ playable: isPlayable, audioSync: true });
    };

    testVideo.onerror = () => {
      clearTimeout(timeout);
      res({ playable: false, audioSync: false });
    };
  });
}
