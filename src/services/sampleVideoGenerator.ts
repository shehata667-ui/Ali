/**
 * Generates a real sample test video (horizontal 16:9 1280x720) with audio tones,
 * animated graphics, and realistic metadata so the user can test the full
 * 9:16 TikTok transformation, watermark, and batch pipeline immediately.
 */
export async function createSampleVideo(title = 'فيديو_تجريبي_16x9.webm', durationSeconds = 5): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  const fps = 30;
  const totalFrames = durationSeconds * fps;
  const stream = canvas.captureStream(fps);

  // Audio tone generator
  let audioStreamTrack: MediaStreamTrack | null = null;
  let audioCtx: AudioContext | null = null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const dest = audioCtx.createMediaStreamDestination();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz standard tone
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);

    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    if (dest.stream.getAudioTracks().length > 0) {
      audioStreamTrack = dest.stream.getAudioTracks()[0];
      stream.addTrack(audioStreamTrack);
    }
  } catch (e) {
    console.warn('Audio synthesis not supported:', e);
  }

  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {});
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], title, { type: 'video/webm' });
      resolve(file);
    };

    recorder.start();

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;

      // Render colorful cinematic frame
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gradient horizon
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#4338ca');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
      ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

      // Moving graphic
      const cx = canvas.width / 2 + Math.sin(progress * Math.PI * 4) * 200;
      const cy = canvas.height / 2;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();

      // Info text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Cairo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TikTok Studio - فيديو اختباري أفقي 16:9', canvas.width / 2, 120);

      ctx.font = '24px "Cairo", sans-serif';
      ctx.fillText(`ثواني العرض: ${(progress * durationSeconds).toFixed(1)} ث / ${durationSeconds} ث`, canvas.width / 2, canvas.height - 80);

      if (frame >= totalFrames) {
        clearInterval(interval);
        recorder.stop();
      }
    }, 1000 / fps);
  });
}
