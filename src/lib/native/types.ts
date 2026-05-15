export type NativePlatform = 'android' | 'ios' | 'web'

export interface CameraResult {
  path: string
  base64?: string
  dataUrl?: string
  format: 'jpeg' | 'png' | 'webp'
  width: number
  height: number
  size: number
}

export interface ScanResult {
  value: string
  format: BarcodeFormat
  corners?: { x: number; y: number }[]
}

export type BarcodeFormat =
  | 'qr_code'
  | 'aztec'
  | 'codabar'
  | 'code_39'
  | 'code_93'
  | 'code_128'
  | 'data_matrix'
  | 'ean_8'
  | 'ean_13'
  | 'itf'
  | 'pdf_417'
  | 'upc_a'
  | 'upc_e'

export interface BiometricResult {
  success: boolean
  error?: string
  type: BiometricType
}

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'generic'

export interface FilePickerResult {
  path: string
  name: string
  size: number
  type: string
  mimeType: string
  uri: string
}

export interface CompressedImage {
  path: string
  size: number
  width: number
  height: number
  quality: number
}

export interface DeviceInfo {
  platform: NativePlatform
  osVersion: string
  model: string
  manufacturer: string
  appVersion: string
  appBuild: string
  isVirtual: boolean
  isCharging: boolean
  batteryLevel: number
  language: string
  languageCode: string
  orientation: 'portrait' | 'landscape'
}

export interface NetworkStatus {
  connected: boolean
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown'
  isMetered: boolean
  signalStrength: number
}

export interface StorageInfo {
  free: number
  total: number
  used: number
  percentage: number
  cacheSize: number
  dataSize: number
}

export interface PermissionStatus {
  camera: PermissionState
  storage: PermissionState
  location: PermissionState
  notifications: PermissionState
  biometric: PermissionState
  microphone: PermissionState
  calendar: PermissionState
  contacts: PermissionState
  sensors: PermissionState
}

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'

export interface SignatureResult {
  path: string
  dataUrl: string
  width: number
  height: number
}

export interface AppLifecycleState {
  isActive: boolean
  isForeground: boolean
  isBackground: boolean
  previousState: 'active' | 'inactive' | 'background'
  enteredAt: string
}

export interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  speed: number
  status: 'queued' | 'uploading' | 'completed' | 'failed'
  error?: string
}

export interface NativeShareOptions {
  title?: string
  text?: string
  url?: string
  files?: string[]
  dialogTitle?: string
}

export interface SignatureCaptureOptions {
  width?: number
  height?: number
  penColor?: string
  penWidth?: number
  backgroundColor?: string
}

export interface DocumentCaptureOptions {
  quality?: number
  maxWidth?: number
  autoCrop?: boolean
  flashMode?: 'auto' | 'on' | 'off'
}

export interface BarcodeScanOptions {
  formats?: BarcodeFormat[]
  multiple?: boolean
  showUI?: boolean
  flash?: 'auto' | 'on' | 'off'
}
