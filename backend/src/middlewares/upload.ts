import multer from 'multer';

// Configure multer memory storage
const storage = multer.memoryStorage();

// Export upload middleware
export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
});
