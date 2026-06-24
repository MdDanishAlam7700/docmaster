import { ConversionResult } from '@/lib/types';
import { changeExtension } from '@/lib/utils';

type JimpMime = 'image/png' | 'image/jpeg' | 'image/bmp' | 'image/tiff' | 'image/x-ms-bmp' | 'image/gif';
type OutputMime = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp' | 'image/gif';

const JIMP_MIME_MAP: Record<string, JimpMime> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', bmp: 'image/bmp', tiff: 'image/tiff', gif: 'image/gif' };
const OUTPUT_MIME_MAP: Record<string, OutputMime> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', bmp: 'image/bmp', gif: 'image/gif' };

function getJimpMime(ext: string): JimpMime {
  return JIMP_MIME_MAP[ext] || 'image/png';
}

function getMimeForExt(ext: string): OutputMime {
  return OUTPUT_MIME_MAP[ext] || 'image/png';
}

function blobPart(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (data instanceof Uint8Array) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  }
  return data;
}

function blobToPromise(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Canvas conversion failed — the image may be too large or the format is unsupported.'));
    }, mime, quality);
  });
}

export async function resizeImage(file: File, width: number, height: number, maintainAspect: boolean = true): Promise<ConversionResult> {
  const { Jimp } = await import('jimp');
  const bytes = await file.arrayBuffer();
  const image = await Jimp.read(bytes);
  image.resize(maintainAspect ? { w: width } : { w: width, h: height });
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const jimpMime = getJimpMime(ext);
  const outputMime = getMimeForExt(ext);
  const buffer = await image.getBuffer(jimpMime);
  return {
    file: new Blob([blobPart(buffer as unknown as Uint8Array)], { type: outputMime }),
    filename: changeExtension(file.name, ext),
    mimeType: outputMime,
  };
}

export async function compressImage(file: File, quality: number = 80): Promise<ConversionResult> {
  const { Jimp } = await import('jimp');
  const bytes = await file.arrayBuffer();
  const image = await Jimp.read(bytes);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpeg';
  const isJpeg = ext === 'jpg' || ext === 'jpeg';
  const jimpMime: JimpMime = isJpeg ? 'image/jpeg' : 'image/png';
  const outputMime = isJpeg ? 'image/jpeg' : 'image/png';
  const buffer = await image.getBuffer(jimpMime, isJpeg ? { quality } as any : undefined);
  return {
    file: new Blob([blobPart(buffer as unknown as Uint8Array)], { type: outputMime }),
    filename: changeExtension(file.name, isJpeg ? 'jpg' : 'png'),
    mimeType: outputMime,
  };
}

export async function cropImage(file: File, x: number, y: number, w: number, h: number): Promise<ConversionResult> {
  const { Jimp } = await import('jimp');
  const bytes = await file.arrayBuffer();
  const image = await Jimp.read(bytes);
  image.crop({ x, y, w, h });
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const jimpMime = getJimpMime(ext);
  const outputMime = getMimeForExt(ext);
  const buffer = await image.getBuffer(jimpMime);
  return {
    file: new Blob([blobPart(buffer as unknown as Uint8Array)], { type: outputMime }),
    filename: changeExtension(file.name, ext),
    mimeType: outputMime,
  };
}

export async function convertImageFormat(file: File, targetFormat: 'png' | 'jpeg' | 'webp' | 'bmp'): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();

  if (targetFormat === 'webp') {
    const bitmap = await createImageBitmap(new Blob([bytes]));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await blobToPromise(canvas, 'image/webp');
    return {
      file: blob,
      filename: changeExtension(file.name, 'webp'),
      mimeType: 'image/webp',
    };
  }

  const { Jimp } = await import('jimp');
  const image = await Jimp.read(bytes);
  const jimpMimeMap: Record<string, JimpMime> = { png: 'image/png', jpeg: 'image/jpeg', bmp: 'image/bmp' };
  const jimpMime = jimpMimeMap[targetFormat] || 'image/png';
  const outputMimeMap: Record<string, string> = { png: 'image/png', jpeg: 'image/jpeg', bmp: 'image/bmp' };
  const outputMime = outputMimeMap[targetFormat] || 'image/png';
  const buffer = await image.getBuffer(jimpMime);
  return {
    file: new Blob([blobPart(buffer as unknown as Uint8Array)], { type: outputMime }),
    filename: changeExtension(file.name, targetFormat === 'jpeg' ? 'jpg' : targetFormat),
    mimeType: outputMime,
  };
}
