#!/usr/bin/env python3
"""
Environment check script for Railway deployment
"""
import os
import sys

def check_environment():
    """Check environment variables and basic requirements"""
    print("=== Environment Check ===")
    
    # Check Python version
    print(f"Python version: {sys.version}")
    
    # Check environment variables
    env_vars = ["PORT", "HOST", "PYTHONPATH"]
    for var in env_vars:
        value = os.environ.get(var, "Not set")
        print(f"{var}: {value}")
    
    # Check if we can import basic modules
    try:
        import fastapi
        print(f"FastAPI version: {fastapi.__version__}")
    except ImportError as e:
        print(f"FastAPI import error: {e}")
        return False
    
    try:
        import uvicorn
        print(f"Uvicorn available: Yes")
    except ImportError as e:
        print(f"Uvicorn import error: {e}")
        return False
    
    # Check current working directory
    print(f"Current working directory: {os.getcwd()}")
    
    # List files in current directory
    try:
        files = os.listdir(".")
        print(f"Files in current directory: {files[:10]}...")  # Show first 10 files
    except Exception as e:
        print(f"Error listing files: {e}")
    
    return True

if __name__ == "__main__":
    success = check_environment()
    if not success:
        print("Environment check failed!")
        sys.exit(1)
    else:
        print("Environment check passed!")
        sys.exit(0)
