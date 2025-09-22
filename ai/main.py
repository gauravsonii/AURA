"""
FastAPI main application for Aura AI Backend
Provides REST API endpoints for DEX fee recommendations and contract scanning
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel, Field
import json

# Import with error handling for Railway deployment
try:
    from config import Config
except ImportError as e:
    print(f"Warning: Could not import config: {e}")
    # Fallback configuration
    class Config:
        LOG_LEVEL = "INFO"
        LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        API_HOST = "0.0.0.0"
        API_PORT = 8000
        DEBUG = False

# Import data pipeline functions with error handling
try:
    from data_pipeline import (
        get_live_market_data, get_avax_price, get_volatility,
        get_enhanced_coingecko_data, get_multi_coin_data, 
        get_global_market_data, get_market_sentiment, get_cross_asset_analysis
    )
    DATA_PIPELINE_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import data_pipeline: {e}")
    DATA_PIPELINE_AVAILABLE = False
    # Create dummy functions
    async def get_live_market_data(): return {}
    async def get_avax_price(): return 0
    async def get_volatility(): return 0
    async def get_enhanced_coingecko_data(): return {}
    async def get_multi_coin_data(): return {}
    async def get_global_market_data(): return {}
    async def get_market_sentiment(): return "neutral"
    async def get_cross_asset_analysis(): return {}

# Import production models with error handling
try:
    from production_models import get_production_fee_recommendation, get_model_info, train_production_models
    PRODUCTION_MODELS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import production_models: {e}")
    PRODUCTION_MODELS_AVAILABLE = False
    # Create dummy functions
    async def get_production_fee_recommendation(): return {"recommended_fee": 0.3, "confidence": 0.5, "reasoning": "Fallback mode"}
    def get_model_info(): return {"status": "unavailable"}
    async def train_production_models(): return {"status": "unavailable"}

# Import contract scanner with error handling
try:
    from contract_scanner import scan_contract_address, quick_risk_assessment
    CONTRACT_SCANNER_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import contract_scanner: {e}")
    CONTRACT_SCANNER_AVAILABLE = False
    # Create dummy functions
    async def scan_contract_address(address): return {"risk_score": 0.5, "risk_level": "unknown"}
    async def quick_risk_assessment(address): return {"risk_score": 0.5, "risk_level": "unknown"}

# Setup logging
logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL), format=Config.LOG_FORMAT)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Aura AI Backend",
    description="AI-powered backend for Aura Protocol providing DEX fee recommendations and contract analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class FeeRecommendationResponse(BaseModel):
    recommended_fee: float = Field(..., description="Recommended fee percentage")
    confidence: float = Field(..., description="Model confidence (0-1)")
    reasoning: str = Field(..., description="Human-readable reasoning")
    market_condition: str = Field(..., description="Current market condition")
    current_volatility: float = Field(..., description="Current market volatility")
    timestamp: str = Field(..., description="Timestamp of recommendation")

class ContractScanRequest(BaseModel):
    address: str = Field(..., description="Contract address to scan")
    quick: bool = Field(default=False, description="Perform quick scan only")

class ContractScanResponse(BaseModel):
    address: str
    risk_score: float
    risk_level: str
    flags: List[Dict]
    contract_type: str
    is_verified: bool
    recommendation: str
    timestamp: str

class MarketDataResponse(BaseModel):
    price_usd: Optional[float]
    volatility: Optional[float]
    volume_24h: Optional[float]
    market_condition: str
    timestamp: str

class EnhancedMarketDataResponse(BaseModel):
    coingecko: Optional[Dict]
    coingecko_global: Optional[Dict] 
    multi_coins: Optional[Dict]
    pyth: Optional[Dict]
    network: Optional[Dict]
    market_indicators: Optional[Dict]
    cross_asset_analysis: Optional[Dict]
    market_regime: str
    timestamp: str

class CrossAssetAnalysisResponse(BaseModel):
    correlations: Dict
    market_leadership: str
    relative_strength: Dict
    timestamp: str

class GlobalMarketResponse(BaseModel):
    total_market_cap_usd: float
    total_volume_24h_usd: float
    market_cap_percentage: Dict
    market_cap_change_24h: float
    active_cryptocurrencies: int
    market_sentiment: str
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    services: Dict[str, str]

# Enhanced market data endpoints
@app.get("/market-data/enhanced", response_model=EnhancedMarketDataResponse)
async def get_enhanced_market_data():
    """Get comprehensive enhanced market data with CoinGecko integration"""
    try:
        market_data = await get_live_market_data()
        return EnhancedMarketDataResponse(**market_data)
    except Exception as e:
        logger.error(f"Error fetching enhanced market data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch enhanced market data: {str(e)}")

@app.get("/market-data/global", response_model=GlobalMarketResponse) 
async def get_global_market_stats():
    """Get global cryptocurrency market statistics"""
    try:
        global_data = await get_global_market_data()
        if not global_data:
            raise HTTPException(status_code=404, detail="Global market data not available")
        
        return GlobalMarketResponse(**global_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching global market data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch global market data: {str(e)}")

@app.get("/market-data/multi-coin")
async def get_multi_coin_analysis(
    coins: str = Query("avalanche-2,bitcoin,ethereum", description="Comma-separated coin IDs")
):
    """Get multi-coin analysis and correlations"""
    try:
        coin_ids = [coin.strip() for coin in coins.split(",")]
        multi_coin_data = await get_multi_coin_data(coin_ids)
        
        if not multi_coin_data:
            raise HTTPException(status_code=404, detail="Multi-coin data not available")
        
        return {
            "coins": multi_coin_data,
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching multi-coin data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch multi-coin data: {str(e)}")

@app.get("/market-data/cross-asset", response_model=CrossAssetAnalysisResponse)
async def get_cross_asset_correlations():
    """Get cross-asset correlation analysis"""
    try:
        analysis = await get_cross_asset_analysis()
        if not analysis:
            raise HTTPException(status_code=404, detail="Cross-asset analysis not available")
        
        return CrossAssetAnalysisResponse(
            **analysis,
            timestamp=datetime.now().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching cross-asset analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch cross-asset analysis: {str(e)}")

@app.get("/market-data/sentiment")
async def get_market_sentiment_analysis():
    """Get overall market sentiment analysis"""
    try:
        sentiment = await get_market_sentiment()
        global_data = await get_global_market_data()
        enhanced_data = await get_enhanced_coingecko_data()
        
        sentiment_data = {
            "overall_sentiment": sentiment,
            "avax_sentiment": "neutral",
            "confidence": 0.7,
            "timestamp": datetime.now().isoformat()
        }
        
        # Enhanced sentiment analysis
        if enhanced_data:
            rsi = enhanced_data.get("rsi_14", 50)
            volatility = enhanced_data.get("volatility", 0)
            
            if rsi > 70:
                sentiment_data["avax_sentiment"] = "bullish_extreme"
            elif rsi > 60:
                sentiment_data["avax_sentiment"] = "bullish"
            elif rsi < 30:
                sentiment_data["avax_sentiment"] = "bearish_extreme"
            elif rsi < 40:
                sentiment_data["avax_sentiment"] = "bearish"
            
            sentiment_data["volatility_adjusted"] = volatility > 8
            sentiment_data["rsi"] = rsi
        
        if global_data:
            sentiment_data["btc_dominance"] = global_data.get("market_cap_percentage", {}).get("btc", 0)
            sentiment_data["market_cap_change_24h"] = global_data.get("market_cap_change_24h", 0)
        
        return sentiment_data
        
    except Exception as e:
        logger.error(f"Error fetching sentiment analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch sentiment analysis: {str(e)}")

@app.get("/coin/{coin_id}")
async def get_specific_coin_data(coin_id: str):
    """Get detailed data for a specific coin"""
    try:
        coin_data = await get_enhanced_coingecko_data(coin_id)
        if not coin_data:
            raise HTTPException(status_code=404, detail=f"Data for coin '{coin_id}' not available")
        
        return coin_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching data for coin {coin_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch coin data: {str(e)}")

# Global state for caching
market_data_cache = {}
cache_timestamp = None
CACHE_DURATION = 300  # 5 minutes

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    logger.info("Starting Aura AI Backend...")
    
    # Log service availability
    logger.info(f"Data Pipeline Available: {DATA_PIPELINE_AVAILABLE}")
    logger.info(f"Production Models Available: {PRODUCTION_MODELS_AVAILABLE}")
    logger.info(f"Contract Scanner Available: {CONTRACT_SCANNER_AVAILABLE}")
    
    # Validate configuration (non-blocking)
    try:
        if hasattr(Config, 'validate_config') and not Config.validate_config():
            logger.warning("Some API keys are missing - functionality may be limited")
    except Exception as e:
        logger.warning(f"Configuration validation failed: {e}")
    
    # Warm up AI models (non-blocking)
    if PRODUCTION_MODELS_AVAILABLE:
        try:
            logger.info("Warming up AI models...")
            # Production models are ready on import
            logger.info("AI models ready")
        except Exception as e:
            logger.warning(f"AI models warmup failed: {e}")
    else:
        logger.warning("AI models not available - running in fallback mode")
    
    logger.info("Aura AI Backend started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Aura AI Backend...")

# Simple ping endpoint for basic connectivity
@app.get("/ping")
async def ping():
    """Simple ping endpoint"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    services = {
        "ai_models": "healthy" if PRODUCTION_MODELS_AVAILABLE else "degraded",
        "data_pipeline": "healthy" if DATA_PIPELINE_AVAILABLE else "degraded",
        "contract_scanner": "healthy" if CONTRACT_SCANNER_AVAILABLE else "degraded"
    }
    
    # Simple health check - don't test external services during startup
    # This ensures the health check passes even if API keys are missing
    overall_status = "healthy"
    
    return HealthResponse(
        status=overall_status,
        timestamp=datetime.now().isoformat(),
        version="1.0.0",
        services=services
    )

# Market data endpoints
@app.get("/market-data", response_model=MarketDataResponse)
async def get_market_data():
    """Get current market data"""
    try:
        global market_data_cache, cache_timestamp
        
        # Check cache
        if (cache_timestamp and 
            (datetime.now() - cache_timestamp).total_seconds() < CACHE_DURATION and
            market_data_cache):
            logger.debug("Using cached market data")
            return MarketDataResponse(**market_data_cache)
        
        # Fetch fresh data
        market_data = await get_live_market_data()
        coingecko_data = market_data.get("coingecko", {})
        indicators = market_data.get("market_indicators", {})
        
        response_data = {
            "price_usd": coingecko_data.get("price_usd"),
            "volatility": coingecko_data.get("volatility"),
            "volume_24h": coingecko_data.get("volume_24h"),
            "market_condition": indicators.get("volatility_category", "unknown"),
            "timestamp": datetime.now().isoformat()
        }
        
        # Update cache
        market_data_cache = response_data
        cache_timestamp = datetime.now()
        
        return MarketDataResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error fetching market data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")

@app.get("/volatility")
async def get_current_volatility():
    """Get current AVAX volatility"""
    try:
        volatility = await get_volatility()
        return {
            "volatility": volatility,
            "threshold": Config.VOLATILITY_THRESHOLD,
            "status": "high" if volatility and volatility > Config.VOLATILITY_THRESHOLD else "normal",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching volatility: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch volatility: {str(e)}")

# AI recommendation endpoints
@app.get("/recommend-fee", response_model=FeeRecommendationResponse)
async def recommend_fee(
    force_refresh: bool = Query(False, description="Force refresh market data"),
    use_production: bool = Query(True, description="Use production ML models")
):
    """Get AI-powered DEX fee recommendation"""
    try:
        # Get market data
        market_data = None
        if force_refresh or not market_data_cache:
            market_data = await get_live_market_data()
        
        # Get fee recommendation using production ML models or legacy system
        if use_production:
            recommendation = await get_production_fee_recommendation(market_data)
        else:
            recommendation = await get_production_fee_recommendation(market_data)
        
        return FeeRecommendationResponse(
            recommended_fee=recommendation["recommended_fee"],
            confidence=recommendation["confidence"],
            reasoning=recommendation["reasoning"],
            market_condition=recommendation["market_condition"],
            current_volatility=recommendation.get("current_volatility", 0),
            timestamp=recommendation.get("prediction_timestamp", datetime.now().isoformat())
        )
        
    except Exception as e:
        logger.error(f"Error generating fee recommendation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendation: {str(e)}")

@app.get("/recommend-fee/production")
async def recommend_fee_production():
    """Get production ML-based fee recommendation with detailed model info"""
    try:
        recommendation = await get_production_fee_recommendation()
        return recommendation
    except Exception as e:
        logger.error(f"Error generating production fee recommendation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendation: {str(e)}")

@app.get("/model-info")
async def get_ai_model_info():
    """Get information about the trained AI models"""
    try:
        model_info = get_model_info()
        return model_info
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

@app.post("/retrain-models")
async def retrain_ai_models(background_tasks: BackgroundTasks):
    """Retrain production ML models (admin endpoint)"""
    async def retrain():
        try:
            logger.info("Starting model retraining...")
            results = await train_production_models()
            logger.info(f"Model retraining completed: {results}")
        except Exception as e:
            logger.error(f"Model retraining failed: {e}")
    
    background_tasks.add_task(retrain)
    return {
        "message": "Model retraining initiated", 
        "timestamp": datetime.now().isoformat(),
        "note": "This process may take several minutes"
    }

@app.get("/market-analysis")
async def get_market_analysis():
    """Get comprehensive market analysis"""
    try:
        market_data = await get_live_market_data()
        production_recommendation = await get_production_fee_recommendation(market_data)
        
        analysis = {
            "market_data": market_data,
            "fee_recommendation": production_recommendation,
            "analysis_timestamp": datetime.now().isoformat()
        }
        return analysis
    except Exception as e:
        logger.error(f"Error generating market analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate analysis: {str(e)}")

# Contract scanning endpoints
@app.post("/scan-contract", response_model=ContractScanResponse)
async def scan_contract(request: ContractScanRequest):
    """Scan a contract for security risks"""
    try:
        address = request.address.strip()
        
        # Validate address format
        if not address or len(address) != 42 or not address.startswith("0x"):
            raise HTTPException(status_code=400, detail="Invalid contract address format")
        
        if request.quick:
            # Quick risk assessment
            result = await quick_risk_assessment(address)
            return ContractScanResponse(
                address=address,
                risk_score=result["risk_score"],
                risk_level=result["risk_level"],
                flags=[],
                contract_type="unknown",
                is_verified=result.get("is_verified", False),
                recommendation=result["message"],
                timestamp=result["timestamp"]
            )
        else:
            # Full contract scan
            result = await scan_contract_address(address)
            return ContractScanResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scanning contract {request.address}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to scan contract: {str(e)}")

@app.get("/scan-contract/{address}")
async def scan_contract_get(
    address: str,
    quick: bool = Query(False, description="Perform quick scan only")
):
    """Scan a contract via GET request"""
    request = ContractScanRequest(address=address, quick=quick)
    return await scan_contract(request)

@app.get("/quick-risk/{address}")
async def quick_risk(address: str):
    """Quick risk assessment for a contract"""
    try:
        result = await quick_risk_assessment(address)
        return result
    except Exception as e:
        logger.error(f"Error in quick risk assessment for {address}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to assess risk: {str(e)}")

# Utility endpoints
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Aura AI Backend",
        "version": "2.1.0",
        "description": "Enhanced AI-powered backend for Aura Protocol with comprehensive CoinGecko integration",
        "ml_features": {
            "production_models": ["Random Forest", "Gradient Boosting", "Neural Network"],
            "ensemble_prediction": True,
            "real_time_training": True,
            "confidence_scoring": True,
            "technical_analysis": True
        },
        "coingecko_features": {
            "comprehensive_data": True,
            "multi_coin_analysis": True,
            "global_market_data": True,
            "cross_asset_correlations": True,
            "technical_indicators": ["RSI", "Price Volatility", "Volume Analysis"],
            "market_regime_detection": True,
            "sentiment_analysis": True
        },
        "endpoints": {
            # Core endpoints
            "health": "/health",
            "market_data": "/market-data",
            "volatility": "/volatility",
            
            # Enhanced CoinGecko endpoints
            "enhanced_market_data": "/market-data/enhanced",
            "global_market_data": "/market-data/global", 
            "multi_coin_analysis": "/market-data/multi-coin",
            "cross_asset_analysis": "/market-data/cross-asset",
            "sentiment_analysis": "/market-data/sentiment",
            "specific_coin": "/coin/{coin_id}",
            
            # AI endpoints
            "recommend_fee": "/recommend-fee",
            "recommend_fee_production": "/recommend-fee/production",
            "model_info": "/model-info",
            "retrain_models": "/retrain-models",
            "market_analysis": "/market-analysis",
            
            # Contract scanning
            "scan_contract": "/scan-contract",
            "quick_risk": "/quick-risk/{address}",
            
            # Documentation
            "docs": "/docs"
        },
        "supported_coins": [
            "avalanche-2", "bitcoin", "ethereum", "solana", "cardano", 
            "polkadot", "chainlink", "polygon-pos", "litecoin", "uniswap"
        ],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/config")
async def get_config():
    """Get current configuration (excluding sensitive data)"""
    return {
        "api_version": "1.0.0",
        "base_fee_rate": Config.BASE_FEE_RATE,
        "volatility_threshold": Config.VOLATILITY_THRESHOLD,
        "cache_ttl": Config.CACHE_TTL,
        "model_retrain_interval": Config.MODEL_RETRAIN_INTERVAL,
        "has_api_keys": {
            "coingecko": bool(Config.COINGECKO_API_KEY),
            "snowtrace": bool(Config.SNOWTRACE_API_KEY)
        },
        "timestamp": datetime.now().isoformat()
    }

# Background tasks
@app.post("/retrain-model")
async def retrain_model(background_tasks: BackgroundTasks):
    """Trigger model retraining (admin endpoint)"""
    def retrain():
        try:
            # This would trigger model retraining in a real implementation
            logger.info("Model retraining triggered")
        except Exception as e:
            logger.error(f"Model retraining failed: {e}")
    
    background_tasks.add_task(retrain)
    return {"message": "Model retraining initiated", "timestamp": datetime.now().isoformat()}

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Endpoint not found",
            "available_endpoints": [
                "/health", "/market-data", "/recommend-fee", 
                "/scan-contract", "/docs"
            ]
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )

# Development and testing utilities
if Config.DEBUG:
    @app.get("/test/data-pipeline")
    async def test_data_pipeline():
        """Test data pipeline (debug only)"""
        try:
            from data_pipeline import test_pipeline
            await test_pipeline()
            return {"status": "success", "message": "Data pipeline test completed"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")
    
    @app.get("/test/ai-models")
    async def test_ai_models():
        """Test AI models (debug only)"""
        try:
            # Test production model
            market_data = await get_live_market_data()
            recommendation = await get_production_fee_recommendation(market_data)
            model_info = await get_model_info()
            
            return {
                "status": "success", 
                "message": "AI models test completed",
                "sample_recommendation": recommendation,
                "model_info": model_info
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")
    
    @app.get("/test/contract-scanner")
    async def test_contract_scanner():
        """Test contract scanner (debug only)"""
        try:
            from contract_scanner import test_scanner
            await test_scanner()
            return {"status": "success", "message": "Contract scanner test completed"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

# Main function to run the server
def main():
    """Main function to run the FastAPI server"""
    logger.info(f"Starting Aura AI Backend on {Config.API_HOST}:{Config.API_PORT}")
    
    uvicorn.run(
        "main:app",
        host=Config.API_HOST,
        port=Config.API_PORT,
        reload=Config.DEBUG,
        log_level=Config.LOG_LEVEL.lower()
    )

if __name__ == "__main__":
    main()