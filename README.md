# Team75 Capstone Project

A comprehensive full-stack application featuring a RAG (Retrieval Augmented Generation) chatbot, user authentication system, and document evaluation platform.

## 📋 Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Components](#project-components)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Overview

This capstone project integrates multiple components to create a complete document management and Q&A system:

- **RAG Chatbot**: Intelligent question-answering system that searches through document collections using vector embeddings
- **Login System**: User authentication and portal interface built with React
- **Evaluation Platform**: Document and image evaluation system using CLIP for similarity analysis

## 📁 Project Structure

```
Team75_Capstone/
├── chatbot/              # RAG Chatbot backend and vector database
│   ├── rag_api.py        # FastAPI backend server
│   ├── pdfs/             # Document storage (ignored in git)
│   ├── vector_july22/    # ChromaDB vector database
│   └── requirements_api.txt
│
├── Login/                # User authentication frontend
│   ├── src/              # React source code
│   ├── public/           # Static assets
│   └── package.json
│
└── Evaluation/           # Document evaluation system
    ├── evaluation/       # React evaluation interface
    ├── checkpoint-2200/ # ML model checkpoints (ignored in git)
    └── analysis_output/  # Evaluation results
```

## ✨ Features

### RAG Chatbot
- ✅ Semantic search across 3500+ document chunks
- ✅ Cross-encoder re-ranking for improved relevance
- ✅ Source attribution showing PDF origins
- ✅ FastAPI REST API with CORS support
- ✅ Integration with Ollama LLM (llama3.2:1b)

### Login System
- ✅ React-based user interface
- ✅ Authentication portal
- ✅ Responsive design

### Evaluation Platform
- ✅ CLIP-based image-text similarity analysis
- ✅ Document parsing and analysis
- ✅ Report evaluation interface
- ✅ Image processing capabilities

## 🛠 Tech Stack

### Backend
- **FastAPI**: REST API framework
- **ChromaDB**: Vector database for embeddings
- **Sentence Transformers**: Text embeddings (BAAI/bge-base-en-v1.5)
- **Ollama**: Local LLM inference (llama3.2:1b)
- **Cross-Encoder**: Re-ranking model (ms-marco-MiniLM-L-6-v2)
- **CLIP**: Vision-language model for image-text similarity

### Frontend
- **React**: UI framework
- **React Scripts**: Build tooling

### Infrastructure
- **Python 3.7+**: Backend runtime
- **Node.js**: Frontend runtime
- **ChromaDB**: Persistent vector storage

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.7+** with pip
- **Node.js** (v14 or higher) and npm
- **Ollama** ([Installation Guide](https://ollama.ai))
- **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Team75_Capstone
```

### 2. Install Python Dependencies

```bash
cd chatbot
pip install -r requirements_api.txt
```

### 3. Install Node.js Dependencies

#### For Login System:
```bash
cd ../Login
npm install
```

#### For Evaluation Interface:
```bash
cd ../Evaluation/evaluation
npm install
```

### 4. Set Up Ollama

```bash
# Install Ollama (if not already installed)
# Visit https://ollama.ai for installation instructions

# Pull the required model
ollama pull llama3.2:1b
```

### 5. Set Up CLIP (for Evaluation)

```bash
pip install git+https://github.com/openai/CLIP.git
```

**Note**: After installing CLIP, restart your Jupyter kernel if using notebooks.

## 💻 Usage

### Starting the RAG Chatbot Backend

```bash
cd chatbot
python rag_api.py
```

The API will be available at `http://localhost:8000`

### Starting the Login Frontend

```bash
cd Login
npm start
```

The application will open at `http://localhost:3000`

### Starting the Evaluation Interface

```bash
cd Evaluation/evaluation
npm start
```

### Quick Start Script (Windows)

For the chatbot API, you can use the provided batch file:

```bash
cd chatbot
start_rag_api.bat
```

## 📚 API Documentation

### RAG Chatbot API Endpoints

#### Health Check
```http
GET http://localhost:8000/
```

Response:
```json
{
  "message": "RAG Chatbot API is running!",
  "status": "ok"
}
```

#### Database Status
```http
GET http://localhost:8000/api/health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "total_chunks": 3531
}
```

#### Chat Endpoint
```http
POST http://localhost:8000/api/chat
Content-Type: application/json

{
  "message": "Your question here"
}
```

Response:
```json
{
  "response": "Answer from the RAG system...",
  "success": true
}
```

### Testing the API

```bash
# Health check
curl http://localhost:8000/

# Database status
curl http://localhost:8000/api/health

# Send a question
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is plant disease detection?"}'
```

## 🔧 Project Components

### 1. RAG Chatbot (`chatbot/`)

The Retrieval Augmented Generation system that enables intelligent document Q&A.

**Architecture:**
```
React Frontend → FastAPI Backend → ChromaDB → Ollama LLM
```

**Key Files:**
- `rag_api.py`: Main FastAPI application
- `vector_july22/`: ChromaDB vector database
- `pdfs/`: Document storage (not in git)

**Features:**
- Semantic search using vector embeddings
- Re-ranking with cross-encoder
- Source attribution
- Error handling and fallbacks

See [README_RAG_INTEGRATION.md](chatbot/README_RAG_INTEGRATION.md) for detailed integration guide.

### 2. Login System (`Login/`)

React-based authentication and portal interface.

**Key Features:**
- User authentication
- Portal dashboard
- Responsive UI

**Start Development:**
```bash
cd Login
npm start
```

### 3. Evaluation Platform (`Evaluation/`)

Document and image evaluation system using CLIP for similarity analysis.

**Key Features:**
- CLIP-based image-text similarity
- Document parsing
- Report analysis
- Image processing

**Setup Notes:**
- See [CLIP_INSTALLATION_NOTES.md](Evaluation/CLIP_INSTALLATION_NOTES.md) for CLIP setup
- Model checkpoints are stored in `checkpoint-2200/` (excluded from git)

## 🐛 Troubleshooting

### RAG Chatbot Issues

**Issue**: "Can't connect to RAG chatbot"
- **Solution**: Ensure `rag_api.py` is running on port 8000
- Check if Ollama is running: `ollama list`

**Issue**: "Model requires more system memory"
- **Solution**: The project uses `llama3.2:1b` which is lightweight
- If issues persist, try: `ollama pull tinyllama`

**Issue**: CORS errors
- **Solution**: Update allowed origins in `rag_api.py` line 20

**Issue**: Slow responses
- **First request**: 30-60s (model loading)
- **Subsequent requests**: 2-5s (normal)

### CLIP Installation Issues

**Issue**: "No module named 'clip'"
- **Solution**: Restart Jupyter kernel after installation
- Reinstall: `pip install git+https://github.com/openai/CLIP.git`

**Issue**: "CUDA out of memory"
- **Solution**: Use CPU mode: `device = "cpu"` in your code

### General Issues

**Issue**: Port already in use
- **Solution**: Change port in configuration files or kill the process using the port

**Issue**: Dependencies not installing
- **Solution**: Ensure Python 3.7+ and Node.js 14+ are installed
- Try: `pip install --upgrade pip` and `npm install --legacy-peer-deps`

## 📝 Configuration

### Changing the LLM Model

Edit `chatbot/rag_api.py` line 148:
```python
def answer_with_ollama(question, n_chunks=3, model="llama3.2:1b", ...):
```

### Changing API Port

Edit `chatbot/rag_api.py` line 201:
```python
uvicorn.run(app, host="0.0.0.0", port=8080)
```

Don't forget to update the React frontend API URL accordingly.

### Adjusting Number of Chunks

Edit `chatbot/rag_api.py`:
```python
def answer_with_ollama(question, n_chunks=5, ...):  # Increase for more context
```

## 🚫 Git Ignore

The following are excluded from version control:
- Large model files (`*.safetensors`, `*.pt`, `*.pth`)
- Checkpoint directories (`checkpoint-*/`)
- Node modules (`node_modules/`)
- PDF documents (`chatbot/pdfs/`)

See `.gitignore` for the complete list.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is part of a capstone project. All rights reserved.

## 👥 Team

**Team 75** - Capstone Project

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Note**: This project uses large model files and vector databases that are excluded from git. Ensure you have the necessary resources and dependencies installed before running the application.
