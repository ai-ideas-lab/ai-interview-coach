import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OpenAIApi } from 'openai';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const openai = new OpenAIApi({
  apiKey: process.env.OPENAI_API_KEY
});

export const interviewController = {
  // Create interview session
  createSession: async (req: AuthRequest, res: Response) => {
    const { type, title, description, experienceLevel, targetIndustry, targetRole } = req.body;

    const session = await prisma.interviewSession.create({
      data: {
        userId: req.user!.id,
        type,
        title,
        description,
        experienceLevel,
        targetIndustry,
        targetRole,
        status: 'planning'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: session,
      message: 'Interview session created successfully'
    });
  },

  // Get user's interview sessions
  getUserSessions: async (req: AuthRequest, res: Response) => {
    const sessions = await prisma.interviewSession.findMany({
      where: { userId: req.user!.id },
      include: {
        questions: {
          orderBy: { createdAt: 'desc' }
        },
        feedbacks: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: sessions,
      message: 'Sessions retrieved successfully'
    });
  },

  // Get specific session
  getSession: async (req: AuthRequest, res: Response) => {
    const session = await prisma.interviewSession.findFirst({
      where: { 
        id: req.params.id, 
        userId: req.user!.id 
      },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' }
        },
        feedbacks: {
          orderBy: { createdAt: 'desc' }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!session) {
      throw createError('Session not found', 404);
    }

    res.json({
      success: true,
      data: session,
      message: 'Session retrieved successfully'
    });
  },

  // Update session
  updateSession: async (req: AuthRequest, res: Response) => {
    const { title, description, status } = req.body;

    const session = await prisma.interviewSession.updateMany({
      where: { 
        id: req.params.id, 
        userId: req.user!.id 
      },
      data: {
        title,
        description,
        status,
        updatedAt: new Date()
      }
    });

    if (session.count === 0) {
      throw createError('Session not found or access denied', 404);
    }

    const updatedSession = await prisma.interviewSession.findUnique({
      where: { id: req.params.id },
      include: {
        questions: true,
        feedbacks: true
      }
    });

    res.json({
      success: true,
      data: updatedSession,
      message: 'Session updated successfully'
    });
  },

  // Delete session
  deleteSession: async (req: AuthRequest, res: Response) => {
    const result = await prisma.interviewSession.deleteMany({
      where: { 
        id: req.params.id, 
        userId: req.user!.id 
      }
    });

    if (result.count === 0) {
      throw createError('Session not found or access denied', 404);
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  },

  // Add question to session
  addQuestion: async (req: AuthRequest, res: Response) => {
    const { question, type, category, expectedAnswer } = req.body;

    const questionData = await prisma.interviewQuestion.create({
      data: {
        sessionId: req.params.id,
        question,
        type,
        category,
        expectedAnswer
      }
    });

    res.status(201).json({
      success: true,
      data: questionData,
      message: 'Question added successfully'
    });
  },

  // Get session questions
  getSessionQuestions: async (req: AuthRequest, res: Response) => {
    const questions = await prisma.interviewQuestion.findMany({
      where: { sessionId: req.params.id },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: questions,
      message: 'Questions retrieved successfully'
    });
  },

  // Update question
  updateQuestion: async (req: AuthRequest, res: Response) => {
    const { question, userAnswer, rating, notes } = req.body;

    const updatedQuestion = await prisma.interviewQuestion.update({
      where: { 
        id: req.params.id,
        sessionId: { 
          userId: req.user!.id 
        }
      },
      data: {
        question,
        userAnswer,
        rating,
        notes,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedQuestion,
      message: 'Question updated successfully'
    });
  },

  // Delete question
  deleteQuestion: async (req: AuthRequest, res: Response) => {
    const result = await prisma.interviewQuestion.deleteMany({
      where: { 
        id: req.params.id,
        sessionId: { 
          userId: req.user!.id 
        }
      }
    });

    if (result.count === 0) {
      throw createError('Question not found or access denied', 404);
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  },

  // Start interview
  startInterview: async (req: AuthRequest, res: Response) => {
    const session = await prisma.interviewSession.update({
      where: { 
        id: req.params.id, 
        userId: req.user!.id 
      },
      data: {
        status: 'in_progress',
        startTime: new Date()
      }
    });

    // Generate AI-generated questions based on user preferences
    const questions = await generateAIQuestions(req.user!, session);

    res.json({
      success: true,
      data: { session, questions },
      message: 'Interview started successfully'
    });
  },

  // Submit answer
  submitAnswer: async (req: AuthRequest, res: Response) => {
    const { questionId, answer, timeSpent } = req.body;

    const question = await prisma.interviewQuestion.update({
      where: { 
        id: questionId,
        sessionId: { 
          userId: req.user!.id 
        }
      },
      data: {
        userAnswer: answer,
        updatedAt: new Date()
      }
    });

    // Analyze the answer using AI
    const analysis = await analyzeAnswer(answer, question, req.user!);

    res.json({
      success: true,
      data: { question, analysis },
      message: 'Answer submitted successfully'
    });
  },

  // Analyze answer
  analyzeAnswer: async (req: AuthRequest, res: Response) => {
    const { questionId, answer } = req.body;

    const question = await prisma.interviewQuestion.findFirst({
      where: { 
        id: questionId,
        sessionId: { 
          userId: req.user!.id 
        }
      }
    });

    if (!question) {
      throw createError('Question not found', 404);
    }

    const analysis = await analyzeAnswer(answer, question, req.user!);

    res.json({
      success: true,
      data: analysis,
      message: 'Answer analyzed successfully'
    });
  },

  // Provide feedback
  provideFeedback: async (req: AuthRequest, res: Response) => {
    const { type, content, rating, suggestions, strengths, improvements, actionableItems } = req.body;

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user!.id,
        sessionId: req.params.id,
        type,
        content,
        rating,
        suggestions,
        strengths,
        improvements,
        actionableItems
      }
    });

    // Update session score
    const sessionFeedbacks = await prisma.feedback.findMany({
      where: { sessionId: req.params.id }
    });

    const avgScore = sessionFeedbacks.reduce((sum, f) => sum + f.rating, 0) / sessionFeedbacks.length;

    await prisma.interviewSession.update({
      where: { id: req.params.id },
      data: {
        score: Math.round(avgScore),
        status: 'completed',
        endTime: new Date()
      }
    });

    res.json({
      success: true,
      data: feedback,
      message: 'Feedback provided successfully'
    });
  },

  // Get session score
  getSessionScore: async (req: AuthRequest, res: Response) => {
    const session = await prisma.interviewSession.findFirst({
      where: { 
        id: req.params.id, 
        userId: req.user!.id 
      },
      include: {
        feedbacks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!session) {
      throw createError('Session not found', 404);
    }

    res.json({
      success: true,
      data: {
        score: session.score,
        totalQuestions: session.questions?.length || 0,
        completedQuestions: session.questions?.filter(q => q.userAnswer).length || 0,
        feedbacks: session.feedbacks
      },
      message: 'Score retrieved successfully'
    });
  },

  // Create practice session
  createPracticeSession: async (req: AuthRequest, res: Response) => {
    const { type, category, difficulty } = req.body;

    const session = await prisma.interviewSession.create({
      data: {
        userId: req.user!.id,
        type,
        title: `Practice ${type} Interview - ${category}`,
        description: `Practice ${difficulty} level ${category} questions`,
        status: 'planning'
      }
    });

    // Generate practice questions
    const questions = await generateAIQuestions(req.user!, session, difficulty);

    res.status(201).json({
      success: true,
      data: { session, questions },
      message: 'Practice session created successfully'
    });
  },

  // Get user analytics
  getUserAnalytics: async (req: AuthRequest, res: Response) => {
    const sessions = await prisma.interviewSession.findMany({
      where: { userId: req.user!.id },
      include: {
        questions: true,
        feedbacks: true
      }
    });

    const analytics = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      averageScore: sessions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / sessions.filter(s => s.score).length || 0,
      totalQuestions: sessions.reduce((sum, s) => sum + s.questions.length, 0),
      answeredQuestions: sessions.reduce((sum, s) => sum + s.questions.filter(q => q.userAnswer).length, 0),
      categories: sessions.reduce((acc, s) => {
        s.questions.forEach(q => {
          acc[q.category] = (acc[q.category] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      data: analytics,
      message: 'Analytics retrieved successfully'
    });
  }
};

// Helper functions
const generateAIQuestions = async (user: any, session: any, difficulty?: string) => {
  const prompt = `
    Generate ${difficulty ? `${difficulty} level` : 'moderate difficulty'} ${session.type} interview questions for a ${user.experienceLevel} ${user.targetRole} candidate in ${user.targetIndustry}.
    
    Focus on ${session.type === 'technical' ? 'algorithms, data structures, and system design' : 'behavioral and situational'} questions.
    
    Return exactly 5 questions in JSON format with the following structure:
    {
      "questions": [
        {
          "question": "Question text",
          "type": "${session.type}",
          "category": "Specific category",
          "expectedAnswer": "Key points to look for"
        }
      ]
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 1000
  });

  const questionsData = JSON.parse(response.choices[0].message.content);
  
  const questions = await Promise.all(
    questionsData.questions.map((q: any) =>
      prisma.interviewQuestion.create({
        data: {
          sessionId: session.id,
          question: q.question,
          type: q.type,
          category: q.category,
          expectedAnswer: q.expectedAnswer
        }
      })
    )
  );

  return questions;
};

const analyzeAnswer = async (answer: string, question: any, user: any) => {
  const prompt = `
    Analyze this interview answer for a ${user.experienceLevel} ${user.targetRole} candidate:
    
    Question: ${question.question}
    Category: ${question.category}
    Expected Answer: ${question.expectedAnswer}
    
    Candidate Answer: ${answer}
    
    Provide analysis in JSON format:
    {
      "strengths": ["List key strengths"],
      "improvements": ["List areas for improvement"],
      "score": 1-5 rating,
      "feedback": "Overall feedback",
      "suggestions": ["Specific suggestions"]
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1000
  });

  return JSON.parse(response.choices[0].message.content);
};