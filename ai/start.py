#!/usr/bin/env python3
"""
Startup script for Aura AI Backend
Handles graceful fallback if main application fails to start
"""
import sys
import logging
import os

# Set environment variables for Railway
os.environ.setdefault("PORT", "8000")
os.environ.setdefault("HOST", "0.0.0.0")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def start_minimal():
    """Start minimal application"""
    logger.info("Starting minimal FastAPI application...")
    
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from datetime import datetime
    import uvicorn
    
    # Create minimal app
    app = FastAPI(title="Aura AI Backend (Minimal)", version="1.0.0")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.get("/")
    async def root():
        return {"status": "ok", "mode": "minimal", "timestamp": datetime.now().isoformat()}
    
    @app.get("/health")
    async def health():
        return {"status": "healthy", "mode": "minimal", "timestamp": datetime.now().isoformat()}
    
    @app.get("/ping")
    async def ping():
        return {"status": "ok", "timestamp": datetime.now().isoformat()}
    
    # Start server
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")

def main():
    """Main startup function"""
    logger.info("=== Aura AI Backend Startup ===")
    
    try:
        logger.info("Attempting to start full application...")
        from main import app
        import uvicorn
        
        port = int(os.environ.get("PORT", 8000))
        host = os.environ.get("HOST", "0.0.0.0")
        
        logger.info(f"Starting full application on {host}:{port}")
        uvicorn.run(app, host=host, port=port, log_level="info")
        
    except Exception as e:
        logger.error(f"Failed to start main application: {e}")
        logger.info("=== Falling back to minimal mode ===")
        
        try:
            start_minimal()
        except Exception as e2:
            logger.error(f"Failed to start minimal application: {e2}")
            logger.error("All startup attempts failed!")
            sys.exit(1)

if __name__ == "__main__":
    main()
