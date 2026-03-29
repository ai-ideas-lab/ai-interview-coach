import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OpenAIApi } from 'openai';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const openai = new OpenAIApi({
  apiKey: process.env.OPENAI_API_KEY
});

export const feedbackController = {
  // Create feedback
  createFeedback: async (req: AuthRequest, res: Response) => {
    const { sessionId, type, content, rating, suggestions, strengths, improvements, actionableItems } = req.body;

    // Check if session belongs to user
    const session = await prisma.interviewSession.findFirst({
      where: { 
        id: sessionId, 
        userId: req.user!.id 
      }
    });

    if (!session) {
      throw createError('Session not found or access denied', 404);
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user!.id,
        sessionId,
        type,
        content,
        rating,
        suggestions,
        strengths,
        improvements,
        actionableItems
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback created successfully'
    });
  },

  // Get session feedbacks
  getSessionFeedbacks: async (req: AuthRequest, res: Response) => {
    const feedbacks = await prisma.feedback.findMany({
      where: { sessionId: req.params.sessionId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: feedbacks,
      message: 'Feedbacks retrieved successfully'
    });
  },

  // Get user feedbacks
  getUserFeedbacks: async (req: AuthRequest, res: Response) => {
    const feedbacks = await prisma.feedback.findMany({
      where: { userId: req.user!.id },
      include: {
        session: {
          select: { id: true, title: true, type: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: feedbacks,
      message: 'Feedbacks retrieved successfully'
    });
  },

  // Update feedback
  updateFeedback: async (req: AuthRequest, res: Response) => {
    const { content, rating, suggestions, strengths, improvements, actionableItems } = req.body;

    const feedback = await prisma.feedback.updateMany({
      where: { 
        id: req.params.id,
        userId: req.user!.id 
      },
      data: {
        content,
        rating,
        suggestions,
        strengths,
        improvements,
        actionableItems,
        updatedAt: new Date()
      }
    });

    if (feedback.count === 0) {
      throw createError('Feedback not found or access denied', 404);
    }

    const updatedFeedback = await prisma.feedback.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback updated successfully'
    });
  },

  // Delete feedback
  deleteFeedback: async (req: AuthRequest, res: Response) => {
    const result = await prisma.feedback.deleteMany({
      where: { 
        id: req.params.id,
        userId: req.user!.id 
      }
    });

    if (result.count === 0) {
      throw createError('Feedback not found or access denied', 404);
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  },

  // Generate AI feedback
  generateAIFeedback: async (req: AuthRequest, res: Response) => {
    const { sessionId, questionId, userAnswer, expectedAnswer } = req.body;

    // Get session and question details
    const session = await prisma.interviewSession.findFirst({
      where: { 
        id: sessionId, 
        userId: req.user!.id 
      }
    });

    if (!session) {
      throw createError('Session not found or access denied', 404);
    }

    const question = await prisma.interviewQuestion.findFirst({
      where: { 
        id: questionId,
        sessionId: sessionId 
      }
    });

    if (!question) {
      throw createError('Question not found', 404);
    }

    // Generate AI feedback
    const feedback = await generateAIFeedback(
      userAnswer,
      expectedAnswer,
      question,
      session,
      req.user!
    );

    res.json({
      success: true,
      data: feedback,
      message: 'AI feedback generated successfully'
    });
  }
};

// Helper function to generate AI feedback
const generateAIFeedback = async (
  userAnswer: string,
  expectedAnswer: string,
  question: any,
  session: any,
  user: any
) => {
  const prompt = `
    Analyze the following interview response and provide detailed feedback:

    **Candidate Information:**
    - Experience Level: ${user.experienceLevel}
    - Target Role: ${user.targetRole}
    - Target Industry: ${user.targetIndustry}

    **Question Details:**
    - Type: ${question.type}
    - Category: ${question.category}
    - Question: ${question.question}
    - Expected Answer: ${expectedAnswer}

    **Candidate's Answer:**
    ${userAnswer}

    Please provide feedback in JSON format:
    {
      "strengths": ["Key strengths in the answer"],
      "improvements": ["Areas for improvement"],
      "rating": 1-5 score,
      "feedback": "Overall assessment",
      "suggestions": ["Specific suggestions for improvement"],
      "actionableItems": ["Concrete action items"],
      "summary": "Brief summary of performance"
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1500
  });

  const feedbackData = JSON.parse(response.choices[0].message.content);

  // Save feedback to database
  const feedback = await prisma.feedback.create({
    data: {
      userId: user.id,
      sessionId: session.id,
      type: 'ai_generated',
      content: feedbackData.feedback,
      rating: feedbackData.rating,
      strengths: feedbackData.strengths.join(', '),
      improvements: feedbackData.improvements.join(', '),
      actionableItems: feedbackData.actionableItems,
      suggestions: feedbackData.suggestions.join(', ')
    }
  });

  return {
    ...feedbackData,
    id: feedback.id,
    createdAt: feedback.createdAt
  };
};