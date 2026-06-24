import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FileCategory } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const EXTENSION_MAP: Record<string, FileCategory> = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  xls: 'excel',
  xlsx: 'excel',
  csv: 'excel',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  bmp: 'image',
  webp: 'image',
  svg: 'image',
  tiff: 'image',
  tif: 'image',
  txt: 'text',
  rtf: 'text',
  html: 'html',
  htm: 'html',
  md: 'markdown',
  json: 'text',
  xml: 'text',
};

export function getFileCategory(filename: string): FileCategory {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_MAP[ext] || 'other';
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function changeExtension(filename: string, newExt: string): string {
  const base = filename.substring(0, filename.lastIndexOf('.')) || filename;
  return `${base}.${newExt}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadMultipleFiles(blobs: { file: Blob; filename: string }[]) {
  if (blobs.length === 1) {
    downloadBlob(blobs[0].file, blobs[0].filename);
    return;
  }
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    blobs.forEach(({ file, filename }) => {
      zip.file(filename, file);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, 'converted-files.zip');
  } catch (err) {
    console.error('Failed to create zip file:', err);
    throw new Error('Failed to package files. Try downloading them individually.');
  }
}

export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,image/tiff';
export const ACCEPTED_PDF_TYPES = 'application/pdf';
export const ACCEPTED_WORD_TYPES = 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const ACCEPTED_EXCEL_TYPES = 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';
export const ACCEPTED_ALL_TYPES = [...ACCEPTED_PDF_TYPES.split(','), ...ACCEPTED_WORD_TYPES.split(','), ...ACCEPTED_EXCEL_TYPES.split(','), ACCEPTED_IMAGE_TYPES, 'text/plain,text/html,text/markdown'].join(',');
