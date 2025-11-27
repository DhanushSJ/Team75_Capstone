"""
FastAPI backend for RAG Chatbot integration
This connects your RAG system to the React frontend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from sentence_transformers import SentenceTransformer
import ollama
from sentence_transformers import CrossEncoder
import traceback

app = FastAPI()

# CORS configuration to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
embedding_model = SentenceTransformer("BAAI/bge-base-en-v1.5")
chroma_client = chromadb.PersistentClient(path="vector_july22")
collection = chroma_client.get_or_create_collection(
    name="rag-chunks",
    metadata={"hnsw:space": "cosine"}
)
reranker = None

def initialize_reranker():
    global reranker
    reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
    return reranker

# Request/Response models
class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    success: bool
    error: str = None

def search_similar_chunks(query, n_results=5, min_relevance=0.5):
    try:
        query_embedding = embedding_model.encode([query], normalize_embeddings=True)
        
        search_params = {
            "query_embeddings": query_embedding.tolist(),
            "n_results": min(n_results * 4, 40)
        }
        
        results = collection.query(**search_params)
        
        if not results['documents'][0]:
            return []
        
        candidates = []
        for i, doc in enumerate(results['documents'][0]):
            candidates.append({
                'document': doc,
                'metadata': results['metadatas'][0][i],
                'initial_score': 1 - results['distances'][0][i],
                'id': results['ids'][0][i]
            })
        
        global reranker
        if reranker is None:
            initialize_reranker()
        
        pairs = [[query, c['document'][:512]] for c in candidates]
        rerank_scores = reranker.predict(pairs)
        
        final_results = []
        for i, candidate in enumerate(candidates):
            combined_score = (candidate['initial_score'] * 0.3) + (rerank_scores[i] * 0.7)
            
            if combined_score >= min_relevance:
                candidate['rerank_score'] = rerank_scores[i]
                candidate['final_score'] = combined_score
                final_results.append(candidate)
        
        final_results.sort(key=lambda x: x['final_score'], reverse=True)
        return final_results[:n_results]
    
    except Exception as e:
        print(f"Search failed: {e}")
        traceback.print_exc()
        return []

def build_context_for_chatbot(query, n_chunks=3, min_relevance=0.3):
    results = search_similar_chunks(query, n_chunks, min_relevance=min_relevance)
    
    if not results:
        return "NO_RELEVANT_DOCS_FOUND"
    
    context = "Based on the following information from research documents:\n\n"
    
    for i, result in enumerate(results):
        metadata = result['metadata']
        context += f"[Source {i+1}: {metadata['source']}"
        
        if metadata.get('chapter'):
            context += f", Chapter {metadata['chapter']}"
        if metadata.get('section'):
            context += f", Section {metadata['section']}"
        
        context += f"]\n{result['document']}\n\n"
        context += "-" * 50 + "\n\n"
    
    return context

def answer_with_ollama(question, n_chunks=3, model="llama3.1:8b-instruct-q4_0", temperature=0.3):
    """
    Answer questions using local Llama with RAG context
    Falls back to pretrained knowledge when no relevant chunks found
    """
    context = build_context_for_chatbot(question, n_chunks=n_chunks, min_relevance=0.3)
    
    # Check if we found relevant context
    if context == "NO_RELEVANT_DOCS_FOUND":
        # Modified: Decline to answer when no Computer Science context is available
        print("No relevant chunks found. Declining the question.")
        prompt = f"""Answer strictly from the Computer Science context below.
If the question falls outside CS, reply that you cannot help.

Context:
No Computer Science document context was retrieved. You must respond that you cannot help because the question is not covered by the provided Computer Science documents.

Question: {question}

Answer:"""
    else:
        # Extract PDF names from context and use RAG
        import re
        pdf_sources = re.findall(r'\[Source \d+: ([^,\]]+)', context)
        unique_pdfs = list(set(pdf_sources))
        
        prompt = f"""Based on the following context from research documents, please answer the question accurately.
IMPORTANT: Always mention which PDF document(s) you are getting the information from (the PDFs are: {', '.join(unique_pdfs)}).

Context:
{context}

Question: {question}

Answer (make sure to mention which PDF the information comes from):"""
    
    try:
        response = ollama.chat(
            model=model,
            messages=[
                {'role': 'user', 'content': prompt}
            ],
            options={
                'temperature': temperature,
                'num_predict': 500
            }
        )
        
        return response['message']['content']
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        return f"Error: {str(e)}"

@app.get("/")
def read_root():
    return {"message": "RAG Chatbot API is running!", "status": "ok"}

@app.post("/api/chat", response_model=ChatResponse)
def chat(message: ChatMessage):
    try:
        if not message.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        answer = answer_with_ollama(message.message)
        
        return ChatResponse(
            response=answer,
            success=True
        )
    
    except Exception as e:
        print(f"Error processing chat: {e}")
        traceback.print_exc()
        return ChatResponse(
            response="",
            success=False,
            error=str(e)
        )

@app.get("/api/health")
def health_check():
    try:
        count = collection.count()
        return {
            "status": "healthy",
            "database": "connected",
            "total_chunks": count
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    print("Starting RAG Chatbot API...")
    print("Make sure Ollama is running: ollama serve")
    uvicorn.run(app, host="0.0.0.0", port=8000)

