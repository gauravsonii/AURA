#!/bin/bash

# Aura AI Backend Railway Deployment Script
# This script helps prepare and deploy your AI backend to Railway

set -e

echo "🚀 Aura AI Backend Railway Deployment Script"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: main.py not found. Please run this script from the ai/ directory."
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Error: Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please initialize git first."
    exit 1
fi

echo "✅ Environment checks passed"

# Check if all required files exist
echo "📋 Checking required files..."

required_files=("main.py" "requirements.txt" "railway.json" "Procfile" ".env.example")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ Missing required files:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

echo "✅ All required files present"

# Check git status
echo "📊 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes."
    echo "   Files with changes:"
    git status --porcelain
    echo ""
    read -p "Do you want to commit these changes? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Prepare for Railway deployment"
        echo "✅ Changes committed"
    else
        echo "⚠️  Proceeding with uncommitted changes..."
    fi
else
    echo "✅ Working directory is clean"
fi

# Check if we're on main branch
current_branch=$(git branch --show-current)
echo "🌿 Current branch: $current_branch"

if [ "$current_branch" != "main" ]; then
    echo "⚠️  Warning: You're not on the main branch."
    read -p "Do you want to switch to main branch? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
        echo "✅ Switched to main branch"
    fi
fi

# Push to remote
echo "📤 Pushing to remote repository..."
if git push origin "$current_branch"; then
    echo "✅ Code pushed to remote repository"
else
    echo "❌ Failed to push to remote repository"
    exit 1
fi

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://railway.app"
echo "2. Create a new project"
echo "3. Connect your GitHub repository"
echo "4. Select the 'ai' folder as the root directory"
echo "5. Add environment variables (see .env.example)"
echo "6. Deploy!"
echo ""
echo "📖 For detailed instructions, see RAILWAY_DEPLOYMENT.md"
echo ""
echo "🔗 Your API will be available at: https://your-app-name.railway.app"
echo "📚 API Documentation: https://your-app-name.railway.app/docs"
echo "❤️  Health Check: https://your-app-name.railway.app/health"
