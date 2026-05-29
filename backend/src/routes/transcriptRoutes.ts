import { Router } from 'express';
import {
  getTranscripts,
  createTranscript,
  deleteTranscript,
  getTranscriptById,
  uploadAudioTranscript,
  uploadAudioFileTranscript,
} from '../controllers/transcriptController.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

router.route('/')
  .get(getTranscripts)
  .post(createTranscript);

router.route('/upload')
  .post(uploadAudioTranscript);

router.route('/upload-file')
  .post(upload.single('file'), uploadAudioFileTranscript);

router.route('/:id')
  .get(getTranscriptById)
  .delete(deleteTranscript);

export default router;

