export type AspectRatioType = '9:16' | '16:9' | '1:1' | '4:5' | 'custom';

export type FramingMode = 'blur-background' | 'crop-fill' | 'fit-pad';

export type QualityPresetType = 'low' | 'balanced' | 'ultra' | 'custom';

export interface VideoFileItem {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  url: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  width: number;
  height: number;
  aspectRatio: string;
  fps: number;
  bitrateKbps: number;
  mimeType: string;
  hasAudio: boolean;
  selectedForBatch: boolean;
  report?: TechnicalReport;
}

export interface TechnicalReport {
  width: number;
  height: number;
  durationSeconds: number;
  fileSizeBytes: number;
  bitrateKbps: number;
  fps: number;
  isVFR: boolean;
  codec: string;
  hasLetterbox: boolean;
  letterboxType?: 'top-bottom' | 'sides' | 'none';
  suspectedWatermark: boolean;
  watermarkLocation?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';
  lagRiskScore: 'low' | 'medium' | 'high';
  lagRiskDetails: string;
  technicalIssues: string[];
  actionableRecommendations: string[];
  originalityNotes: string;
}

export interface WatermarkConfig {
  // Text watermark
  enabledText: boolean;
  text: string;
  fontSize: number; // in px on 1080 canvas
  textColor: string;
  textOpacity: number; // 0 to 1
  hasShadow: boolean;
  textXPercent: number; // 0 to 100%
  textYPercent: number; // 0 to 100%

  // Logo watermark
  enabledLogo: boolean;
  logoUrl?: string;
  logoFile?: File;
  logoWidthPercent: number; // 5 to 50%
  logoOpacity: number; // 0 to 1
  logoXPercent: number; // 0 to 100%
  logoYPercent: number; // 0 to 100%
}

export interface ProcessingSettings {
  targetWidth: number; // 1080 or 720
  targetHeight: number; // 1920 or 1280
  targetFps: number; // 30 or 60
  framingMode: FramingMode;
  panX: number; // -50 to 50%
  panY: number; // -50 to 50%
  blurIntensity: number; // in px
  rotation: 0 | 90 | 180 | 270;
  
  // Quality & Compression
  qualityPreset: QualityPresetType;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
  forceCFR: boolean;
  
  // Effects
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  saturation: number; // -50 to 50
  volume: number; // 0 to 150
  isMuted: boolean;
  trimStartSeconds: number;
  trimEndSeconds: number;
  stripMetadata: boolean;
  
  // Watermark
  watermark: WatermarkConfig;
}

export interface ExportedVideo {
  id: string;
  sourceId: string;
  sourceName: string;
  outputName: string;
  blob: Blob;
  url: string;
  fileSizeBytes: number;
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  timestamp: number;
  verifiedPlayable: boolean;
  audioSyncVerified: boolean;
}

export interface BatchJob {
  video: VideoFileItem;
  status: 'idle' | 'analyzing' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0 to 100
  currentFps: number;
  framesProcessed: number;
  totalFrames: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  error?: string;
  result?: ExportedVideo;
}
