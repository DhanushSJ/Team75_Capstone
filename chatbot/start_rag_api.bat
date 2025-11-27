@echo off
echo ===================================
echo Starting RAG Chatbot Backend
echo ===================================
echo.
echo Make sure Ollama is running first!
echo Run 'ollama serve' in another terminal if not already running
echo.
pause
echo.
echo Starting FastAPI server on http://localhost:8000
echo.

python rag_api.py

pause


