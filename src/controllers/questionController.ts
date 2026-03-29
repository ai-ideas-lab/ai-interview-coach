import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OpenAIApi } from 'openai';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const openai = new OpenAIApi({
  apiKey: process.env.OPENAI_API_KEY
});

export const questionController = {
  // Create question
  createQuestion: async (req: AuthRequest, res: Response) => {
    const { type, category, question, expectedAnswer, difficulty, tags, hints } = req.body;

    const questionData = await prisma.questionBank.create({
      data: {
        type,
        category,
        question,
        expectedAnswer,
        difficulty,
        tags,
        hints
      }
    });

    res.status(201).json({
      success: true,
      data: questionData,
      message: 'Question created successfully'
    });
  },

  // Get questions
  getQuestions: async (req: Request, res: Response) => {
    const { type, category, difficulty, limit = 20, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    const [questions, total] = await Promise.all([
      prisma.questionBank.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip
      }),
      prisma.questionBank.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      message: 'Questions retrieved successfully'
    });
  },

  // Get question by ID
  getQuestion: async (req: Request, res: Response) => {
    const question = await prisma.questionBank.findUnique({
      where: { id: req.params.id }
    });

    if (!question) {
      throw createError('Question not found', 404);
    }

    res.json({
      success: true,
      data: question,
      message: 'Question retrieved successfully'
    });
  },

  // Update question
  updateQuestion: async (req: Request, res: Response) => {
    const { type, category, question, expectedAnswer, difficulty, tags, hints } = req.body;

    const updatedQuestion = await prisma.questionBank.update({
      where: { id: req.params.id },
      data: {
        type,
        category,
        question,
        expectedAnswer,
        difficulty,
        tags,
        hints,
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
  deleteQuestion: async (req: Request, res: Response) => {
    const result = await prisma.questionBank.delete({
      where: { id: req.params.id }
    });

    if (!result) {
      throw createError('Question not found', 404);
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  },

  // Filter questions
  filterQuestions: async (req: Request, res: Response) => {
    const { types, categories, difficulties, tags, limit = 50 } = req.query;

    const where: any = {};
    
    if (types) {
      where.type = { in: Array.isArray(types) ? types : [types] };
    }
    
    if (categories) {
      where.category = { in: Array.isArray(categories) ? categories : [categories] };
    }
    
    if (difficulties) {
      where.difficulty = { in: Array.isArray(difficulties) ? difficulties : [difficulties] };
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasSome: tagArray };
    }

    const [questions, total] = await Promise.all([
      prisma.questionBank.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit)
      }),
      prisma.questionBank.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        questions,
        total,
        filters: {
          types: types ? (Array.isArray(types) ? types : [types]) : undefined,
          categories: categories ? (Array.isArray(categories) ? categories : [categories]) : undefined,
          difficulties: difficulties ? (Array.isArray(difficulties) ? difficulties : [difficulties]) : undefined,
          tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined
        }
      },
      message: 'Questions filtered successfully'
    });
  },

  // Create batch questions
  createBatchQuestions: async (req: Request, res: Response) => {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      throw createError('Questions array is required', 400);
    }

    const createdQuestions = await Promise.all(
      questions.map((q: any) =>
        prisma.questionBank.create({
          data: {
            type: q.type,
            category: q.category,
            question: q.question,
            expectedAnswer: q.expectedAnswer,
            difficulty: q.difficulty || 'medium',
            tags: q.tags || [],
            hints: q.hints || []
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      data: createdQuestions,
      message: `${createdQuestions.length} questions created successfully`
    });
  },

  // Generate AI questions
  generateAIQuestions: async (req: AuthRequest, res: Response) => {
    const { type, category, difficulty, count = 5, experienceLevel, targetRole, targetIndustry } = req.body;

    const prompt = `
      Generate ${count} ${difficulty} level ${type} interview questions for a ${experienceLevel} ${targetRole} candidate in ${targetIndustry} industry.
      
      Category: ${category}
      
      Return the questions in JSON format:
      {
        "questions": [
          {
            "question": "Question text here",
            "type": "${type}",
            "category": "${category}",
            "expectedAnswer": "Key points to look for",
            "difficulty": "${difficulty}",
            "tags": ["relevant", "tags"],
            "hints": ["Optional hint 1", "Optional hint 2"]
          }
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 2000
    });

    const questionsData = JSON.parse(response.choices[0].message.content);
    
    const createdQuestions = await Promise.all(
      questionsData.questions.map((q: any) =>
        prisma.questionBank.create({
          data: {
            type: q.type,
            category: q.category,
            question: q.question,
            expectedAnswer: q.expectedAnswer,
            difficulty: q.difficulty || difficulty,
            tags: q.tags || [],
            hints: q.hints || []
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      data: createdQuestions,
      message: `${createdQuestions.length} AI questions generated successfully`
    });
  }
};