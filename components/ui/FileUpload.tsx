'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  label?: string;
  helperText?: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect?: (file: File | null) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FileUpload({
  label,
  helperText = 'ছবি বা PDF (সর্বোচ্চ ৫ মেগাবাইট)',
  accept = 'image/*,application/pdf',
  maxSizeMB = 5,
  onFileSelect,
  error,
  required,
  className,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`ফাইলের সাইজ ${maxSizeMB}MB এর বেশি হতে পারবে না`);
      return;
    }
    setLocalError(null);
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
    onFileSelect?.(null);
  };

  const activeError = error || localError;

  return (
    <div className={cn('w-full space-y-1.5 text-left', className)}>
      {label && (
        <label className="block text-xs sm:text-sm font-semibold text-slate-800 select-none">
          {label}
          {required && <span className="text-rose-600 ml-1 font-bold">*</span>}
        </label>
      )}

      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-150',
            dragActive
              ? 'border-emerald-700 bg-emerald-50/60'
              : 'border-slate-300 hover:border-emerald-600 bg-white hover:bg-slate-50/50',
            activeError ? 'border-rose-300 bg-rose-50/20' : ''
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="sr-only"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-800">
              <span className="text-emerald-800 font-semibold underline underline-offset-2">
                ফাইল নির্বাচন করুন
              </span>{' '}
              বা টেনে এখানে ছাড়ুন
            </div>
            <p className="text-[11px] text-slate-400">{helperText}</p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <File className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="মুছে ফেলুন"
            aria-label="ফাইল মুছুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeError && (
        <p className="text-xs text-rose-700 font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{activeError}</span>
        </p>
      )}
    </div>
  );
}
