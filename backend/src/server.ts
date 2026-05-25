import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import transcriptRoutes from './routes/transcriptRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { ApiResponse } from './utils/apiResponse.js';

// Setup environment configuration
dotenv.config();

// Create Express instance
const app = express();
const PORT = process.env.PORT || 5000;

// Setup Middleware
app.use(cors({
  origin: '*', // Allow all client origins for smooth frontend local setup
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
connectDB();

// Test Connection / Root Route
app.get('/', (req: Request, res: Response) => {
  return ApiResponse.success(res, {
    app: 'SonicScript API',
    status: 'Healthy',
    version: '1.0.0',
    time: new Date()
  }, 'SonicScript Server running successfully');
});

// App Router Integration
app.use('/api/transcripts', transcriptRoutes);

// Fallback Route Handler (404 Not Found)
app.use((req: Request, res: Response) => {
  return ApiResponse.error(res, `Route not found: ${req.originalUrl}`, 404);
});

// Global Error Handler Middleware
app.use(errorHandler);

// Listen
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` SonicScript Server running in ${process.env.NODE_ENV} mode`);
  console.log(` Local: http://localhost:${PORT}`);
  console.log(`========================================`);
});
