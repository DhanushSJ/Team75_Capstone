# RAG Chatbot Integration Guide

## Overview
This guide explains how to integrate your RAG (Retrieval Augmented Generation) chatbot with your React frontend.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React App     │◄───────►│   FastAPI        │◄───────►│   ChromaDB      │
│   (Frontend)    │   HTTP  │   (rag_api.py)   │   Query │   (Vector DB)   │
│   localhost:3000│         │   localhost:8000 │         │   vector_july22 │
└─────────────────┘         └────────┬─────────┘         └─────────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │   Ollama     │
                              │  llama3.2:1b │
                              └──────────────┘
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd chatbot/999
pip install -r requirements_api.txt
```

### 2. Start Ollama (if not running)

```bash
ollama serve
```

### 3. Start the FastAPI Backend

```bash
cd chatbot/999
python rag_api.py
```

The API will start at `http://localhost:8000`

### 4. Start Your React App

```bash
cd login/login
npm start
```

Your app will start at `http://localhost:3000`

## Testing

### Test the API directly:

```bash
curl http://localhost:8000/
curl http://localhost:8000/api/health

curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is plant disease detection?"}'
```

### Test in React:

1. Open your React app in browser
2. Log in as any user
3. Click the chatbot button (floating icon)
4. Ask a question about the documents

## Features

- ✅ **RAG Integration**: Searches your 3531 document chunks
- ✅ **Re-ranking**: Uses cross-encoder for better relevance
- ✅ **Source Attribution**: Shows which PDF the answer comes from
- ✅ **Error Handling**: Graceful fallbacks if backend is down
- ✅ **Loading Indicators**: Shows "..." while processing

## API Endpoints

### `GET /`
Health check
```json
{
  "message": "RAG Chatbot API is running!",
  "status": "ok"
}
```

### `GET /api/health`
Database status
```json
{
  "status": "healthy",
  "database": "connected",
  "total_chunks": 3531
}
```

### `POST /api/chat`
Send a message
```json
Request:
{
  "message": "Your question here"
}

Response:
{
  "response": "The answer from RAG...",
  "success": true
}
```

## Troubleshooting

### Issue: "Can't connect to RAG chatbot"
**Solution**: Make sure `rag_api.py` is running on port 8000

### Issue: "Model requires more system memory"
**Solution**: Already using `llama3.2:1b` which is small. If still failing, try:
```bash
ollama pull tinyllama
# Then update rag_api.py model to "tinyllama"
```

### Issue: CORS errors
**Solution**: Update allowed origins in `rag_api.py` line 20

### Issue: Slow responses
**Solution**: 
- First request loads models (30-60s)
- Subsequent requests are faster (2-5s)
- Consider adding caching

## Customization

### Change Model
Edit `rag_api.py` line 148:
```python
def answer_with_ollama(question, n_chunks=3, model="llama3.2:1b", ...):
```

### Change Number of Chunks
Edit `rag_api.py` line 148:
```python
def answer_with_ollama(question, n_chunks=5, ...):
```

### Change API Port
Edit `rag_api.py` line 201:
```python
uvicorn.run(app, host="0.0.0.0", port=8080)
```
Don't forget to update React App.js line 433

## Production Deployment

For production, consider:
1. Using environment variables for API URLs
2. Adding authentication/API keys
3. Using a production ASGI server (gunicorn + uvicorn workers)
4. Setting up reverse proxy (nginx)
5. Adding rate limiting
6. Caching frequently asked questions

## Next Steps

- Add conversation history
- Add typing indicators
- Add file upload functionality
- Add more models to choose from
- Add analytics tracking


