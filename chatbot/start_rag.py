import subprocess
import sys
import os

print("Starting RAG API...")
print("Press Ctrl+C to stop")
print()

# Change to script directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Run rag_api.py
subprocess.run([sys.executable, "rag_api.py"])


