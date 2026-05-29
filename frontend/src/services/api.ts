import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TranscriptData {
  _id?: string;
  title: string;
  duration: number;
  text: string;
  status: 'pending' | 'completed' | 'failed';
  language: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  accuracy?: number;
  createdAt?: string;
}

// Fallback in-memory list if API is completely unavailable
let offlineTranscripts: TranscriptData[] = [
  {
    _id: 'demo-1',
    title: 'Project Kickoff Meeting',
    duration: 72,
    text: 'Welcome everyone to the VoxNote kickoff meeting. Today we are launching our new AI speech-to-text SaaS foundation. We will focus on extreme visual premium feel, responsive panels, high accessibility, and instant downloads. The goal is to provide human-crafted layouts with zero template clutter.',
    status: 'completed',
    language: 'en',
    accuracy: 97,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: 'demo-2',
    title: 'Product Design Thoughts',
    duration: 120,
    text: 'I think we should stick to a clean, today-human aesthetic. Let us avoid artificial neon greens and purples. Deep charcoal gray surfaces, premium system typography like Inter, subtle cards with glassmorphic borders, and very soft, elegant buttons. Every interaction needs a micro-transition to feel organic and premium.',
    status: 'completed',
    language: 'en',
    accuracy: 94,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  }
];

export const transcriptService = {
  /**
   * Fetch all transcripts
   */
  async getAll(): Promise<TranscriptData[]> {
    try {
      const response = await apiClient.get('/transcripts');
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.warn('Backend API connection failed. Using local state fallback.');
      return offlineTranscripts;
    }
  },

  /**
   * Create a new transcript
   */
  async create(data: Partial<TranscriptData>): Promise<TranscriptData> {
    try {
      const response = await apiClient.post('/transcripts', data);
      if (response.data && response.data.success) {
        // Sync offline cache
        const created = response.data.data;
        offlineTranscripts = [created, ...offlineTranscripts];
        return created;
      }
      return response.data;
    } catch (error) {
      console.warn('Backend API connection failed. Creating local record.');
      const localRecord: TranscriptData = {
        _id: 'transient-' + Math.random().toString(36).substr(2, 9),
        title: data.title || 'Local Audio Recording',
        duration: data.duration || 15,
        text: data.text || 'This transcript was generated in local-only fallback mode. To save records permanently, start your Express backend and MongoDB server.',
        status: 'completed',
        language: data.language || 'en',
        createdAt: new Date().toISOString(),
      };
      offlineTranscripts = [localRecord, ...offlineTranscripts];
      return localRecord;
    }
  },

  /**
   * Delete a transcript
   */
  async delete(id: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/transcripts/${id}`);
      if (response.data && response.data.success) {
        offlineTranscripts = offlineTranscripts.filter(t => t._id !== id);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Backend API connection failed. Deleting local record.');
      offlineTranscripts = offlineTranscripts.filter(t => t._id !== id);
      return true;
    }
  }
};

export interface UserData {
  name: string;
  email: string;
  avatar: string;
  accountType: string;
  storageLimit: number;
  storageUsed: number;
}

export const userService = {
  /**
   * Fetch current seeded sandbox user profile settings
   */
  async getProfile(): Promise<UserData> {
    try {
      const response = await apiClient.get('/users/profile');
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.warn('Backend API connection failed. Using offline profile fallback.');
      
      // Calculate offline fallback storage by totaling local files
      const totalOfflineSize = offlineTranscripts.reduce((sum, item) => sum + (item.fileSize || item.duration * 16000), 0);

      return {
        name: 'Sandbox User',
        email: 'user@voxnote.ai',
        avatar: 'VN',
        accountType: 'Premium AI Sandbox',
        storageLimit: 100 * 1024 * 1024, // 100MB
        storageUsed: 4.2 * 1024 * 1024 + totalOfflineSize,
      };
    }
  }
};
