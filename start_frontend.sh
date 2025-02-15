#!/bin/bash

# Start the frontend application
# This script starts both Ollama and the Streamlit frontend

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    error "Ollama is not installed. Please run the installation script first."
    exit 1
fi

# Check if Python dependencies are installed
if ! command -v pip &> /dev/null; then
    error "pip is not installed. Installing..."
    pkg install python
fi

# Install Python dependencies if not already installed
log "Checking Python dependencies..."
pip install -r requirements.txt

# Start Ollama server in the background
log "Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama server to start
sleep 5

# Start the Streamlit frontend
log "Starting frontend application..."
streamlit run frontend.py --server.port 8501 --server.address 0.0.0.0

# Cleanup when the script is terminated
cleanup() {
    log "Cleaning up..."
    kill $OLLAMA_PID
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for the frontend to exit
wait 