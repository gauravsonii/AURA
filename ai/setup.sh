#!/bin/bash

# Aura AI Backend Setup Script
# This script sets up the Python environment and installs dependencies

set -e

echo "🚀 Setting up Aura AI Backend..."

# Check if Python 3.8+ is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Found Python $PYTHON_VERSION"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "📈 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

echo "✅ Dependencies installed successfully"

# Create models directory
mkdir -p models
echo "✅ Models directory created"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "🔧 Please edit .env file and add your API keys:"
    echo "   - COINGECKO_API_KEY"
    echo "   - SNOWTRACE_API_KEY"
    echo "   - PYTH_API_KEY (optional)"
else
    echo "✅ .env file exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your API keys"
echo "2. Activate the virtual environment: source venv/bin/activate"
echo "3. Run the server: python main.py"
echo "4. Visit http://localhost:8000/docs for API documentation"
echo ""
echo "For testing:"
echo "- python data_pipeline.py (test data pipeline)"
echo "- python production_models.py (test production AI models)"
echo "- python contract_scanner.py (test contract scanner)"