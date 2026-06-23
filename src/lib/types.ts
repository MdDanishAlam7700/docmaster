export type ConversionType =
  | 'merge-pdf' | 'split-pdf' | 'compress-pdf' | 'rotate-pdf'
  | 'delete-pages' | 'extract-pages' | 'reorder-pages' | 'crop-pdf'
  | 'page-numbers' | 'watermark' | 'header-footer' | 'protect-pdf'
  | 'unlock-pdf' | 'sign-pdf' | 'flatten-pdf' | 'repair-pdf'
  | 'compare-pdf' | 'pdf-to-pdfa' | 'redact-pdf' | 'fill-forms'
  | 'pdf-to-word' | 'pdf-to-excel' | 'pdf-to-powerpoint' | 'pdf-to-jpg'
  | 'pdf-to-png' | 'pdf-to-text' | 'pdf-to-html' | 'pdf-to-svg' | 'ocr-pdf'
  | 'word-to-pdf' | 'excel-to-pdf' | 'powerpoint-to-pdf' | 'jpg-to-pdf'
  | 'png-to-pdf' | 'text-to-pdf' | 'html-to-pdf' | 'svg-to-pdf' | 'markdown-to-pdf'
  | 'word-to-excel' | 'excel-to-word' | 'word-to-powerpoint' | 'html-to-word'
  | 'csv-to-excel' | 'excel-to-csv' | 'html-to-markdown' | 'markdown-to-html'
  | 'image-to-word' | 'image-to-excel' | 'image-to-text'
  | 'resize-image' | 'compress-image' | 'crop-image' | 'convert-image'
  | 'word-counter' | 'qr-generator';

export type FileCategory = 'pdf' | 'word' | 'excel' | 'image' | 'text' | 'html' | 'csv' | 'markdown' | 'other';

export interface ConversionResult {
  file: Blob;
  filename: string;
  mimeType: string;
}

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'pdf-tools' | 'from-pdf' | 'to-pdf' | 'document-conversion' | 'image-tools' | 'utilities';
  inputFormats: string[];
  outputFormats: string[];
  acceptsMultiple: boolean;
  maxFiles?: number;
  options?: ToolOption[];
}

export interface ToolOption {
  id: string;
  label: string;
  type: 'select' | 'number' | 'text' | 'checkbox' | 'slider';
  defaultValue: string | number | boolean;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  category: FileCategory;
  preview?: string;
}

export interface ConversionProgress {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error' | 'cancelled';
  progress: number;
  message?: string;
  error?: string;
  current?: number;
  total?: number;
}

export interface ConverterOptions {
  signal?: AbortSignal;
  onProgress?: (progress: number, message?: string) => void;
}
