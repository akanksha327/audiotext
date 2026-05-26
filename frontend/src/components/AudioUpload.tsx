import React, { useState, useRef } from 'react';
import { Upload, FileAudio, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioUploadProps {
  onTranscribeComplete: (title: string, duration: number, text?: string) => Promise<void>;
}

const statusSteps = [
  'Extracting audio data...',
  'Analyzing speech signals...',
  'Processing transcripts...',
  'Formatting punctuation...',
  'Finalizing...'
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
    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB limit.');
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

    const stepInterval = setInterval(() => {
      setProcessStep((prev) => {
        if (prev < statusSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 950);

    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      const fileTitle = file.name.replace(/\.[^/.]+$/, "");
      const simulatedDuration = Math.floor(Math.random() * 120) + 30; 

      await onTranscribeComplete(fileTitle, simulatedDuration);
      
      clearInterval(stepInterval);
      setSuccess(true);
      setFile(null);
    } catch (err) {
      setError('Failed to process the transcription. Please try again.');
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
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`flex flex-col items-center justify-center border border-dashed rounded-xl py-12 px-6 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-[#8A9FE8] bg-[#E4E8F4]/50'
                : 'border-[#D2D8EC] hover:border-[#8A9FE8] bg-white hover:bg-[#F3F5FC]/30'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D2D8EC] bg-[#F3F5FC] mb-4 text-[#8A9FE8]">
              <Upload className="h-5 w-5" />
            </div>
            
            <h3 className="text-xs font-semibold text-[#1A233D] mb-1">
              Drag and drop your audio file
            </h3>
            
            <p className="text-[11px] text-[#505A73] mb-4 max-w-xs">
              Supports MP3, WAV, or M4A (Max 25MB)
            </p>
            
            <span className="text-xs font-medium text-[#1A233D] bg-[#E4E8F4] hover:bg-[#D2D8EC] px-3.5 py-1.5 rounded-lg border border-[#D2D8EC] transition-colors">
              Browse Files
            </span>
          </motion.div>
        )}

        {file && !isProcessing && (
          <motion.div
            key="file-ready"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="minimal-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D2D8EC] bg-[#F3F5FC] text-[#8A9FE8]">
                <FileAudio className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-semibold text-[#1A233D] max-w-[200px] sm:max-w-[320px] truncate" title={file.name}>
                  {file.name}
                </h4>
                <p className="text-[10px] text-[#505A73] mt-0.5">{formatSize(file.size)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={removeFile}
                className="flex-1 sm:flex-none text-xs text-[#505A73] hover:text-[#1A233D] bg-white hover:bg-[#F3F5FC] border border-[#D2D8EC] rounded-lg px-3.5 py-2 font-medium transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={processAudio}
                className="flex-1 sm:flex-none text-xs text-white bg-[#8A9FE8] hover:bg-[#6B82D6] rounded-lg px-4 py-2 font-medium transition-colors cursor-pointer"
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
            className="minimal-panel p-8 text-center flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="flex h-8 w-8 items-center justify-center mb-4">
              <RefreshCw className="h-5 w-5 text-[#8A9FE8] animate-spin" />
            </div>

            <h4 className="text-xs font-semibold text-[#1A233D] mb-1">
              Converting Speech
            </h4>
            
            <p className="text-[11px] text-[#505A73] h-4 mb-4">
              {statusSteps[processStep]}
            </p>

            <div className="w-48 h-1 bg-[#E4E8F4] rounded-full overflow-hidden border border-[#D2D8EC]/50">
              <motion.div
                className="h-full bg-[#8A9FE8]"
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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="minimal-panel p-8 text-center flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D2D8EC] bg-[#F3F5FC] text-[#8A9FE8] mb-4">
              <Check className="h-5 w-5" />
            </div>

            <h4 className="text-xs font-bold text-[#1A233D] mb-1">
              Transcription Complete
            </h4>
            
            <p className="text-[11px] text-[#505A73] mb-4 max-w-xs">
              Your transcript was compiled and saved to your history.
            </p>
            
            <button
              onClick={() => setSuccess(false)}
              className="text-xs font-medium text-[#505A73] hover:text-[#1A233D] bg-[#E4E8F4] hover:bg-[#D2D8EC] border border-[#D2D8EC] rounded-lg px-4 py-2 transition-colors cursor-pointer"
            >
              Upload another file
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-4 flex items-center gap-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3.5 text-left">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

// Minimal RefreshCw icon replacement locally
function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
