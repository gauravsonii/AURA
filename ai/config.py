"""
Configuration module for Aura AI Backend
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # API Keys (Note: Pyth Network price feeds are permissionless - no API key needed)
    COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY", "")
    SNOWTRACE_API_KEY = os.getenv("SNOWTRACE_API_KEY", "")
    
    # RPC Endpoints
    AVALANCHE_RPC_URL = os.getenv("AVALANCHE_RPC_URL", "https://api.avax.network/ext/bc/C/rpc")
    AVALANCHE_FUJI_RPC_URL = os.getenv("AVALANCHE_FUJI_RPC_URL", "https://api.avax-test.network/ext/bc/C/rpc")
    
    # API Configuration
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8000"))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # Model Configuration
    MODEL_RETRAIN_INTERVAL = int(os.getenv("MODEL_RETRAIN_INTERVAL", "3600"))
    VOLATILITY_THRESHOLD = float(os.getenv("VOLATILITY_THRESHOLD", "3.0"))
    BASE_FEE_RATE = float(os.getenv("BASE_FEE_RATE", "0.3"))
    
    # Cache Configuration
    CACHE_TTL = int(os.getenv("CACHE_TTL", "300"))
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = os.getenv("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    
    # API Endpoints
    COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"
    SNOWTRACE_BASE_URL = "https://api.snowtrace.io/api"
    
    # Contract Addresses (Avalanche Mainnet)
    AVAX_CONTRACT_ADDRESS = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"  # WAVAX
    
    @classmethod
    def validate_config(cls):
        """Validate required configuration"""
        required_keys = ["SNOWTRACE_API_KEY"]  # CoinGecko API key is optional for demo use
        missing_keys = [key for key in required_keys if not getattr(cls, key)]
        
        if missing_keys:
            print(f"Warning: Missing required API keys: {', '.join(missing_keys)}")
            print("Please update your .env file with the required API keys")
            print("Note: Pyth Network price feeds are permissionless and don't require API keys")
        
        return len(missing_keys) == 0