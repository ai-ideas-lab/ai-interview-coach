# AI Interview Coach

An AI-powered interview simulation and coaching platform that helps candidates practice for technical and behavioral interviews with real-time feedback and scoring.

## Features

### 🎯 Core Features
- **AI-Powered Interview Simulation**: Generate interview questions using GPT-4
- **Real-time Feedback**: Get instant AI analysis of your answers
- **Multiple Interview Types**: Technical, Behavioral, Case Study, System Design
- **Personalized Practice**: Tailored questions based on experience level and target role
- **Progress Tracking**: Monitor improvement across different categories
- **Detailed Analytics**: Track performance over time and identify areas for growth

### 🛠️ Technical Stack
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: OpenAI GPT-4
- **Authentication**: JWT-based auth
- **File Upload**: Multer for media handling
- **Testing**: Jest
- **Development**: TypeScript, ESLint

### 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/ai-ideas-lab/ai-interview-coach.git
   cd ai-interview-coach
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database connection and API keys
   ```

4. **Run development setup**
   ```bash
   ./dev.sh
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## API Documentation

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Interview Sessions
- `POST /api/interviews/sessions` - Create interview session
- `GET /api/interviews/sessions` - Get user sessions
- `GET /api/interviews/sessions/:id` - Get specific session
- `PUT /api/interviews/sessions/:id` - Update session
- `DELETE /api/interviews/sessions/:id` - Delete session

### Interview Questions
- `POST /api/interviews/sessions/:id/questions` - Add question to session
- `GET /api/interviews/sessions/:id/questions` - Get session questions
- `PUT /api/interviews/questions/:id` - Update question
- `DELETE /api/interviews/questions/:id` - Delete question

### AI Features
- `POST /api/interviews/sessions/:id/start` - Start AI interview
- `POST /api/interviews/sessions/:id/submit-answer` - Submit answer for AI analysis
- `POST /api/interviews/sessions/:id/analyze` - Analyze specific answer
- `POST /api/feedback/ai-generate` - Generate AI feedback

### Feedback & Analytics
- `POST /api/interviews/sessions/:id/feedback` - Provide feedback
- `GET /api/interviews/sessions/:id/score` - Get session score
- `GET /api/interviews/analytics` - Get user analytics

### Questions Bank
- `GET /api/questions` - Get questions from bank
- `POST /api/questions` - Create new question
- `GET /api/questions/filter` - Filter questions by criteria
- `POST /api/questions/generate` - Generate AI questions

## Project Structure

```
ai-interview-coach/
├── src/
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── routes/            # API routes
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── index.ts           # Main application file
├── prisma/
│   └── schema.prisma      # Database schema
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── uploads/              # File uploads
├── logs/                 # Application logs
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

### Users
- Profile information
- Experience level and preferences
- Progress tracking

### Interview Sessions
- Session metadata and status
- Questions and answers
- Feedback and scoring

### Questions Bank
- Pre-defined interview questions
- Categorized by type and difficulty
- AI-generated questions

### Feedback System
- Detailed performance feedback
- Strengths and improvements
- Actionable suggestions

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_interview_coach"

# OpenAI Configuration
OPENAI_API_KEY="your_openai_api_key"
OPENAI_MODEL="gpt-4"

# JWT Configuration
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR="uploads"

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
```

## Development

### Adding New Features
1. Add new database models in `prisma/schema.prisma`
2. Create/update controllers in `src/controllers/`
3. Add routes in `src/routes/`
4. Update middleware if needed
5. Write tests in `tests/`

### Code Quality
- TypeScript strict mode enabled
- ESLint for code linting
- Jest for testing
- Prisma for database management

### Database Migrations
```bash
# Generate Prisma client
prisma generate

# Push schema to database (development)
prisma db push

# Create migration (production)
prisma migrate dev --name migration_name
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

---

Built with ❤️ by AI Ideas Lab