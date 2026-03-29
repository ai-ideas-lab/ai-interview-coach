import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

export const userController = {
  // Register user
  register: async (req: Request, res: Response) => {
    const { email, password, name, experienceLevel, targetIndustry, targetRole } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw createError('User already exists with this email', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        experienceLevel: experienceLevel || 'entry',
        targetIndustry: targetIndustry || 'tech',
        targetRole: targetRole || 'developer'
      },
      select: {
        id: true,
        email: true,
        name: true,
        experienceLevel: true,
        targetIndustry: true,
        targetRole: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      },
      message: 'User registered successfully'
    });
  },

  // Login user
  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          experienceLevel: user.experienceLevel,
          targetIndustry: user.targetIndustry,
          targetRole: user.targetRole
        },
        token
      },
      message: 'Login successful'
    });
  },

  // Get user profile
  getProfile: async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        experienceLevel: true,
        targetIndustry: true,
        targetRole: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: user,
      message: 'Profile retrieved successfully'
    });
  },

  // Update user profile
  updateProfile: async (req: AuthRequest, res: Response) => {
    const { name, experienceLevel, targetIndustry, targetRole } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name,
        experienceLevel,
        targetIndustry,
        targetRole,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        experienceLevel: true,
        targetIndustry: true,
        targetRole: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  },

  // Update user preferences
  updatePreferences: async (req: AuthRequest, res: Response) => {
    const { preferences } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        // Store preferences as JSON field if needed
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        experienceLevel: true,
        targetIndustry: true,
        targetRole: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: user,
      message: 'Preferences updated successfully'
    });
  },

  // Get user preferences
  getPreferences: async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        experienceLevel: true,
        targetIndustry: true,
        targetRole: true
      }
    });

    res.json({
      success: true,
      data: user,
      message: 'Preferences retrieved successfully'
    });
  },

  // Get user progress
  getProgress: async (req: AuthRequest, res: Response) => {
    const progress = await prisma.progress.findMany({
      where: { userId: req.user!.id },
      orderBy: { category: 'asc' }
    });

    res.json({
      success: true,
      data: progress,
      message: 'Progress retrieved successfully'
    });
  },

  // Update user progress
  updateProgress: async (req: AuthRequest, res: Response) => {
    const { category } = req.params;
    const { level, score, completed } = req.body;

    const progress = await prisma.progress.upsert({
      where: {
        userId_category: {
          userId: req.user!.id,
          category
        }
      },
      update: {
        level: level || undefined,
        score: score || undefined,
        completed: completed || undefined,
        updatedAt: new Date()
      },
      create: {
        userId: req.user!.id,
        category,
        level: level || 1,
        score: score || 0,
        completed: completed || false
      }
    });

    res.json({
      success: true,
      data: progress,
      message: 'Progress updated successfully'
    });
  }
};

// Helper function to generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};