'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, FileText, FileImage, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize, getFileCategory, generateId } from '@/lib/utils';
import { UploadedFile } from '@/lib/types';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const MAX_FILE_SIZE_STR = '200MB';

interface FileUploaderProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  label?: string;
  description?: string;
}

const categoryIcons = {
  pdf: FileText,
  word: FileText,
  excel: FileSpreadsheet,
  image: FileImage,
  text: FileText,
  html: FileText,
  csv: FileSpreadsheet,
  markdown: FileText,
  other: File,
};

export function FileUploader({
  files,
  onFilesChange,
  accept,
  multiple = true,
  maxFiles = 20,
  maxFileSize = MAX_FILE_SIZE,
  label = 'Drop files here',
  description = 'or click to browse',
}: FileUploaderProps) {
  const previewUrlsRef = useRef<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (fileError) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setFileError(null), 5000);
    }
    return () => clearTimeout(errorTimerRef.current);
  }, [fileError]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const oversized = acceptedFiles.filter(f => f.size > maxFileSize);
      if (oversized.length > 0) {
        const names = oversized.map(f => `"${f.name}"`).join(', ');
        setFileError(`${names} ${oversized.length === 1 ? 'exceeds' : 'exceed'} the ${MAX_FILE_SIZE_STR} limit for browser processing.`);
        return;
      }
      const remaining = maxFiles - files.length;
      if (remaining <= 0) {
        setFileError(`Maximum of ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed. Remove some files first.`);
        return;
      }
      const newFiles: UploadedFile[] = acceptedFiles.slice(0, remaining).map((file) => {
        const id = generateId();
        const preview = getFileCategory(file.name) === 'image' ? URL.createObjectURL(file) : undefined;
        if (preview) previewUrlsRef.current.push(preview);
        return {
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          category: getFileCategory(file.name),
          preview,
        };
      });
      onFilesChange([...files, ...newFiles]);
    },
    [files, onFilesChange, maxFiles, maxFileSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles: maxFiles - files.length,
  });

  const removeFile = (id: string) => {
    const removed = files.find(f => f.id === id);
    if (removed?.preview) {
      URL.revokeObjectURL(removed.preview);
      previewUrlsRef.current = previewUrlsRef.current.filter(url => url !== removed.preview);
    }
    onFilesChange(files.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'h-14 w-14 rounded-2xl flex items-center justify-center transition-colors',
            isDragActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-medium">{isDragActive ? 'Drop files here' : label}</p>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Max file size: {MAX_FILE_SIZE_STR} (all processing is in-browser)</p>
          </div>
          <Button variant="outline" size="sm" type="button">
            Browse Files
          </Button>
        </div>
      </div>

      {fileError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
          <span className="text-xs font-medium">{fileError}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => {
            const Icon = categoryIcons[f.category] || File;
            return (
              <div
                key={f.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {f.preview ? (
                  <img src={f.preview} alt={f.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeFile(f.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
