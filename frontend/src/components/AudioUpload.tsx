import React, { useState, useRef } from 'react';
import { Upload, FileAudio, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioUploadProps {
  onTranscribeComplete: (title: string, duration: number, text?: string) => Promise<void>;
}

const statusSteps = [
  'Reading audio stream...',
  'Extracting frequency coefficients...',
  'Aligning phonetic boundaries...',
  'Formatting sentence punctuation...',
  'Finalizing transcript...'
];

export default function AudioUpload({ onTranscribeComplete }: AudioUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/x-m4a', 'audio/m4a'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.mp3') && !file.name.endsWith('.wav') && !file.name.endsWith('.m4a')) {
      setError('Please upload a supported audio file (.mp3, .wav, .m4a)');
      return false;
    }
    // Limit to 25MB for local safety
    if (file.size > 25 * 1024 * 1024) {
      setError('File is too large. Maximum size is 25MB.');
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    setSuccess(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processAudio = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProcessStep(0);
    setError(null);

    // Simulate progress steps
    const stepInterval = setInterval(() => {
      setProcessStep((prev) => {
        if (prev < statusSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 900);

    try {
      // Simulate transcription delay
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      const fileTitle = file.name.replace(/\.[^/.]+$/, ""); // Strip file extension
      // Simulate duration (typically 30-180 seconds for test files)
      const simulatedDuration = Math.floor(Math.random() * 120) + 30; 

      await onTranscribeComplete(fileTitle, simulatedDuration);
      
      clearInterval(stepInterval);
      setSuccess(true);
      setFile(null);
    } catch (err) {
      setError('An error occurred during transcription processing.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*,.mp3,.wav,.m4a"
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {!file && !isProcessing && !success && (
          <motion.div
            key="uploader"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-12 px-6 text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? 'border-brand-indigo bg-brand-indigo/[0.04]'
                : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.01] hover:bg-white/[0.02]'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] mb-4 text-text-secondary group-hover:text-white transition-colors">
              <Upload className="h-6 w-6 text-text-secondary" />
            </div>
            <h3 className="text-sm font-medium text-white mb-1">
              Drag & drop audio files
            </h3>
            <p className="text-xs text-text-secondary mb-4 max-w-xs leading-normal">
              Support .mp3, .wav, .m4a up to 25MB
            </p>
            <span className="text-xs font-semibold text-brand-indigo hover:text-brand-indigo-hover bg-brand-indigo/10 px-3 py-1.5 rounded-lg border border-brand-indigo/20 transition-all">
              Choose file
            </span>
          </motion.div>
        )}

        {file && !isProcessing && (
          <motion.div
            key="file-ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel border-white/[0.08] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo">
                <FileAudio className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-medium text-white max-w-[200px] sm:max-w-[320px] truncate" title={file.name}>
                  {file.name}
                </h4>
                <p className="text-xs text-text-secondary">{formatSize(file.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={removeFile}
                className="flex-1 sm:flex-none text-xs text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl px-4 py-2 font-medium transition-all"
              >
                Remove
              </button>
              <button
                onClick={processAudio}
                className="flex-1 sm:flex-none text-xs text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded-xl px-4 py-2 font-medium transition-all shadow-md shadow-brand-indigo/15 active:scale-95"
              >
                Transcribe
              </button>
            </div>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel rounded-2xl border-white/[0.08] p-8 text-center flex flex-col items-center justify-center"
          >
            <div className="relative flex items-center justify-center mb-6">
              <RefreshCw className="h-10 w-10 text-brand-indigo animate-spin" />
            </div>
            <h4 className="text-sm font-medium text-white mb-2">
              Processing Transcript
            </h4>
            <p className="text-xs text-brand-indigo animate-pulse h-4">
              {statusSteps[processStep]}
            </p>
            {/* Custom progressive visual bar */}
            <div className="w-48 h-1 bg-white/[0.05] rounded-full overflow-hidden mt-6">
              <motion.div
                className="h-full bg-brand-indigo"
                initial={{ width: 0 }}
                animate={{ width: `${((processStep + 1) / statusSteps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel rounded-2xl border-brand-indigo/25 bg-brand-indigo/[0.02] p-8 text-center flex flex-col items-center justify-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-indigo/20 border border-brand-indigo/35 text-brand-indigo mb-4">
              <Check className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Transcription Complete!
            </h4>
            <p className="text-xs text-text-secondary mb-4 leading-normal">
              Your transcript was compiled and saved to database history.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-xs text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl px-4 py-2 font-medium transition-all"
            >
              Upload another file
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-xs text-red-400 bg-red-400/5 border border-red-400/10 rounded-xl p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
