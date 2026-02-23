# 🩺 DiaBP  Diet Consultant - AI-Powered Health Assistant

A modern, full-stack web application that provides personalized diet plans and health recommendations using AI-powered RAG (Retrieval-Augmented Generation) technology. Built for diabetes and hypertension patients with comprehensive health tracking and professional diet planning capabilities.

## 🚀 Features

### 🤖 AI-Powered Diet Assistant
- **RAG-based Chatbot**: Intelligent responses grounded in medical literature
- **Personalized Diet Plans**: AI-generated meal plans for 1 week, 10 days, 2 weeks, 3 weeks, and 1 month
- **Medical Document Processing**: OCR extraction of medical data from PDFs and images
- **Professional PDF Export**: Download diet plans in professionally formatted PDFs

### 👤 User Management
- **Secure Authentication**: User registration and login with session persistence
- **Health Profile Management**: Comprehensive health data tracking
- **BMI Calculator**: Automatic BMI calculation with health category classification
- **Medical Records**: Upload and track medical documents and lab results

### 📊 Health Tracking
- **Blood Pressure Monitoring**: Track systolic and diastolic readings
- **Blood Sugar Tracking**: Monitor glucose levels and HbA1c
- **Medical History**: Comprehensive health record management
- **Data Visualization**: Visual health metrics and trends

### 🎯 Diet Planning
- **Personalized Recommendations**: Based on diabetes type, blood pressure, and BMI
- **Nutritional Guidelines**: Evidence-based dietary recommendations
- **Lifestyle Recommendations**: Exercise and activity suggestions
- **Professional Formatting**: ChatGPT-like structured responses

### 🔧 Admin Features
- **User Management**: Comprehensive admin dashboard
- **Database Records**: View all user data in tabular format
- **Health Analytics**: Monitor user health trends and statistics

## 🛠️ Tech Stack

### Frontend
- **Next.js** - React framework with server-side rendering
- **React Hooks & Context API** - State management
- **Tailwind CSS** - Utility-first CSS framework
- **jsPDF** - Client-side PDF generation
- **WebSocket** - Real-time chat communication

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Lightweight database
- **WebSocket** - Real-time communication
- **Background Tasks** - Asynchronous file processing

### AI & ML
- **Google Gemini** - Large Language Model integration
- **FAISS** - Vector similarity search
- **Sentence Transformers** - Text embedding
- **PyMuPDF** - PDF processing
- **Tesseract OCR** - Image text extraction

### RAG System
- **Knowledge Base**: Medical literature and guidelines
- **Vector Search**: Semantic document retrieval
- **Context-Aware Responses**: Grounded in scientific literature
* To make To add more data 
  uv run batch_ingest.py --pdf_dir data --output_dir faiss
*

## 📁 Project Structure

```
S_FYP/
├── 📁 Frontend (Next.js)
│   ├── pages/                 # Next.js pages and routing
│   ├── components/            # React components
│   │   ├── Chatbot.js        # AI chatbot widget
│   │   ├── Header.js         # Navigation header
│   │   └── Layout.js         # Main layout wrapper
│   ├── context/              # React context providers
│   ├── utils/                # Utility functions
│   └── styles/               # CSS and Tailwind config
│
├── 📁 Backend (FastAPI)
│   ├── api/                  # API endpoints
│   │   └── chatbot.py        # Chatbot API routes
│   ├── ChatBot/              # RAG system core
│   │   ├── data/             # Knowledge base and uploads
│   │   ├── models/           # ML models
│   │   ├── gemini_llm.py     # LLM integration
│   │   ├── retriever.py      # RAG retrieval
│   │   ├── ocr_parser.py     # Medical data extraction
│   │   └── knowledge_base.py # PDF processing
│   ├── instance/             # Database files
│   ├── exports/              # Data exports
│   └── tests/                # Test files
│
└── 📁 Documentation
    ├── docs/                 # Project documentation
    └── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16+)
- **Python** (v3.8+)
- **Tesseract OCR** (for image processing)
- **Git**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd S_FYP
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
# OR using uv (recommended)
uv sync
```

#### Environment Configuration
Create `.env` file in `backend/`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Run Backend Server
```bash
# Using uvicorn
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# OR using uv
uv run uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

#### Install Dependencies
```bash
npm install
```

#### Run Development Server
```bash
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000
- **API Documentation**: http://127.0.0.1:8000/docs

## 🎯 Usage Guide

### For Users

#### 1. **Account Setup**
- Sign up with email and password
- Complete health profile (diabetes status, blood pressure, BMI)

#### 2. **Health Assessment**
- Enter height and weight for BMI calculation
- Upload medical documents (optional)
- View health category and recommendations

#### 3. **AI Diet Assistant**
- Click the floating chat widget (bottom-right corner)
- Ask diet-related questions
- Generate personalized diet plans
- Download plans as professional PDFs

#### 4. **Health Tracking**
- Add blood pressure readings
- Track blood sugar levels
- Monitor health trends over time

### For Administrators

#### 1. **Admin Access**
- Login with admin credentials
- Access comprehensive dashboard

#### 2. **User Management**
- View all registered users
- Monitor user health data
- Access detailed diet plans

#### 3. **Data Analytics**
- Export user data
- View health statistics
- Monitor system usage

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key
MAX_UPLOAD_SIZE_MB=25
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/jpg,image/png
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:8000
```

### Database
- **SQLite**: Default database (backend/instance/diet_consultant.db)
- **Auto-creation**: Database and tables created automatically on startup

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
npm test
```

## 📚 API Documentation

### Chatbot Endpoints
- `POST /api/chat/session` - Create chat session
- `POST /api/chat/{session_id}/message` - Send message
- `WebSocket /ws/chat/{session_id}` - Real-time chat
- `POST /api/chat/{session_id}/generate-diet-plan` - Generate diet plan
- `GET /api/chat/{session_id}/medical-data` - Get extracted medical data

### User Management
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/users` - Get user data (admin)

### Health Tracking
- `POST /api/bmi` - Calculate BMI
- `POST /api/records` - Add health records
- `GET /api/records` - Get health history

## 🔒 Security Features

- **Password Hashing**: bcrypt encryption
- **Session Management**: Secure token-based authentication
- **Input Validation**: Comprehensive data validation
- **File Upload Security**: Type and size restrictions
- **CORS Protection**: Cross-origin request handling

## 🚀 Deployment

### Production Setup
1. **Environment**: Set production environment variables
2. **Database**: Configure production database
3. **Static Files**: Build and serve frontend
4. **Process Management**: Use PM2 or similar
5. **Reverse Proxy**: Configure Nginx

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** for AI capabilities
- **FastAPI** for the backend framework
- **Next.js** for the frontend framework
- **Tailwind CSS** for styling
- **Medical research community** for diet and health guidelines

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs/`
- Review the API documentation at `/docs`

---

**Built with ❤️ for better health outcomes** 
