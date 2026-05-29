import { useState, useRef, useEffect } from 'react';
import { 
  FileText, Copy, Trash2, Check, Upload
} from 'lucide-react';
import AudioUpload from '../components/AudioUpload.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function UploadPage() {
  const { showToast } = useToast();
  const [transcript, setTranscript] = useState('');
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll transcript workspace to bottom
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTo({
        top: textareaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcript]);

  const handleTranscribeComplete = async (
    _title: string, 
    _duration: number, 
    finalCompiledText: string,
    _metadata?: any
  ) => {
    setTranscript(finalCompiledText);
    showToast('File transcription completed and saved', 'success');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uploaded-transcript-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Transcript exported as TXT', 'success');
  };

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>VoxNote Transcript</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #18181b; line-height: 1.6; }
            .header { border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; margin-bottom: 24px; }
            h1 { color: #8b5cf6; margin: 0 0 8px 0; font-size: 22px; }
            .content { font-size: 14px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VoxNote File Transcript</h1>
            <p style="font-size: 11px; color: #71717a; margin: 0;">Compiled via Deepgram File Pipeline</p>
          </div>
          <div class="content">${transcript}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    showToast('Transcript exported as PDF', 'success');
  };

  const handleClear = () => {
    if (confirm('Clear current workspace?')) {
      setTranscript('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch text-left select-none h-full min-h-[calc(100vh-10rem)]">
      
      {/* LEFT UPLOAD INTERACTION AREA (5 cols) */}
      <div className="lg:col-span-5 flex">
        <div className="glass-panel p-6 sm:p-8 flex flex-col justify-between w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-accent via-brand-primary to-transparent" />
          
          <div>
            <h3 className="text-[10px] font-bold text-stone-text-muted flex items-center gap-2 mb-8 uppercase tracking-widest">
              <Upload className="h-3.5 w-3.5 text-brand-accent" /> Audio File Pipeline
            </h3>

            <div className="py-2">
              <AudioUpload 
                onTranscribeComplete={handleTranscribeComplete}
              />
            </div>
          </div>
          
          <div className="text-[9px] text-stone-text-muted font-semibold leading-relaxed border-t border-stone-border/40 pt-4 mt-6">
            Supported formats: MP3, WAV, and M4A up to 25MB. Files are processed securely.
          </div>
        </div>
      </div>

      {/* RIGHT TRANSCRIPT PANEL (7 cols) */}
      <div className="lg:col-span-7 flex">
        <div className="glass-panel p-6 sm:p-8 flex flex-col justify-between w-full h-full min-h-[460px]">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-border/50 pb-4 mb-5">
            <div className="flex flex-col gap-1">
              <h3 className="text-[10px] font-bold text-stone-text-muted uppercase tracking-widest">File Transcription</h3>
              <p className="text-[9px] text-stone-text-muted tracking-widest font-bold uppercase mt-1">
                COMPLETED FILE OUTPUTS
              </p>
            </div>

            {/* Workspace Actions */}
            {transcript && (
              <div className="flex items-center gap-1.5 self-end sm:self-auto select-none">
                <button
                  onClick={handleCopy}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-border text-stone-text-secondary hover:text-white hover:border-brand-primary bg-stone-secondary/40 hover:bg-stone-card transition-colors cursor-pointer"
                  title="Copy text"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="h-8 px-2.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-stone-border text-stone-text-secondary hover:text-white hover:border-brand-primary bg-stone-secondary/40 hover:bg-stone-card transition-colors cursor-pointer"
                >
                  TXT
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="h-8 px-2.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-stone-border text-stone-text-secondary hover:text-white hover:border-brand-primary bg-stone-secondary/40 hover:bg-stone-card transition-colors cursor-pointer"
                >
                  PDF
                </button>
                <button
                  onClick={handleClear}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-border hover:border-brand-primary text-stone-text-secondary hover:text-red-500 bg-stone-secondary/40 hover:bg-stone-card transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Textarea container */}
          <div className="flex-1 flex flex-col">
            {transcript ? (
              <div className="relative flex-grow flex flex-col bg-[#241B18]/20 border border-stone-border/40 rounded-xl p-4 min-h-[300px]">
                <textarea
                  ref={textareaRef}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full flex-grow text-xs leading-relaxed text-[#F5EDE8] bg-transparent outline-none border-none resize-none font-sans placeholder-stone-text-muted"
                />
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-stone-text-muted py-20 border border-dashed border-stone-border/40 rounded-xl bg-[#241B18]/10 select-none">
                <FileText className="h-8 w-8 opacity-25 mb-2" />
                <p className="text-xs font-semibold">Workspace is empty</p>
                <p className="text-[10px] text-stone-text-muted mt-1 max-w-[240px] text-center leading-relaxed">
                  Drop a file in the upload zone on the left to start compiling transcripts.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
