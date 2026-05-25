import { Router } from 'express';
import {
  getTranscripts,
  createTranscript,
  deleteTranscript,
} from '../controllers/transcriptController.js';

const router = Router();

router.route('/')
  .get(getTranscripts)
  .post(createTranscript);

router.route('/:id')
  .delete(deleteTranscript);

export default router;
