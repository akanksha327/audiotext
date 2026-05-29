import { useState, useEffect } from 'react';
import { ListFilter } from 'lucide-react';
import TranscriptionHistory from '../components/TranscriptionHistory.jsx';
import { transcriptService, TranscriptData } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function HistoryPage() {
  const [transcripts, setTranscripts] = useState<TranscriptData[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await transcriptService.getAll();
      setTranscripts(data);
    } catch (err) {
      console.error('Error fetching history catalog:', err);
      showToast('Failed to load history catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const success = await transcriptService.delete(id);
      if (success) {
        setTranscripts((prev) => prev.filter((t) => t._id !== id));
        showToast('Transcript deleted successfully', 'success');
      } else {
        showToast('Could not delete transcript', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting transcript', 'error');
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    try {
      const found = transcripts.find((t) => t._id === id);
      if (!found) return;

      await transcriptService.create({
        _id: id,
        title: newTitle,
        text: found.text,
        duration: found.duration,
        status: found.status,
        language: found.language,
        fileName: found.fileName,
        fileSize: found.fileSize,
        mimeType: found.mimeType,
        accuracy: found.accuracy
      });

      setTranscripts((prev) =>
        prev.map((t) => (t._id === id ? { ...t, title: newTitle } : t))
      );
      showToast('Transcript renamed successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to rename transcript', 'error');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center gap-2 border-b border-stone-border pb-3 select-none">
        <ListFilter className="h-5 w-5 text-brand-primary" />
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Audio Transcripts Catalog</h2>
          <p className="text-xs text-stone-text-secondary mt-0.5">
            Search, filter, view summaries, translate languages, rename records, and delete documents.
          </p>
        </div>
      </div>

      <div className="glass-panel p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Glossy line reflection */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent" />
        
        <TranscriptionHistory
          transcripts={transcripts}
          onDelete={handleDelete}
          onRename={handleRename}
          loading={loading}
        />
      </div>
    </div>
  );
}
