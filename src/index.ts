import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import interviewRoutes from './routes/interview.js';
import userRoutes from './routes/user.js';
import feedbackRoutes from './routes/feedback.js';
import questionRoutes from './routes/questions.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/interviews', authMiddleware, interviewRoutes);
app.use('/api/feedback', authMiddleware, feedbackRoutes);
app.use('/api/questions', authMiddleware, questionRoutes);

// Error handling
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    // Run migrations if in development
    if (process.env.NODE_ENV === 'development') {
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
      console.log('Database migrations completed');
    }
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 AI Interview Coach server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer().catch(console.error);