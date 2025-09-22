"""
Real-time data pipeline for Aura AI Backend
Integrates with Pyth, CoinGecko, and Avalanche RPC
"""
import aiohttp
import asyncio
import time
from typing import Dict, Optional, List
import json
import logging
from datetime import datetime, timedelta

from config import Config

# Setup logging
logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL), format=Config.LOG_FORMAT)
logger = logging.getLogger(__name__)

class DataCache:
    """Simple in-memory cache for API responses"""
    def __init__(self, ttl: int = Config.CACHE_TTL):
        self.cache = {}
        self.ttl = ttl
    
    def get(self, key: str):
        if key in self.cache:
            data, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return data
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, value):
        self.cache[key] = (value, time.time())

# Global cache instance
cache = DataCache()

class OracleDataPipeline:
    """Main class for fetching real-time market data"""
    
    def __init__(self):
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def fetch_coingecko_data(self, coin_id: str = "avalanche-2") -> Optional[Dict]:
        """Fetch comprehensive live market data from CoinGecko API"""
        cache_key = f"coingecko_{coin_id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug(f"Using cached CoinGecko data for {coin_id}")
            return cached_data
        
        try:
            url = f"{Config.COINGECKO_BASE_URL}/coins/{coin_id}"
            headers = {
                "Accept": "application/json",
                "User-Agent": "Aura-AI-DEX/1.0"
            }
            
            params = {
                "localization": "false",
                "tickers": "true",
                "market_data": "true",
                "community_data": "false",
                "developer_data": "false",
                "sparkline": "true"  # Enable sparkline for trend analysis
            }
            
            if Config.COINGECKO_API_KEY:
                headers["x-cg-demo-api-key"] = Config.COINGECKO_API_KEY
            
            async with self.session.get(url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    market_data_raw = data.get("market_data", {})
                    
                    # Extract comprehensive market data
                    market_data = {
                        # Basic price data
                        "price_usd": market_data_raw.get("current_price", {}).get("usd", 0),
                        "price_change_1h": market_data_raw.get("price_change_percentage_1h", 0),
                        "price_change_24h": market_data_raw.get("price_change_percentage_24h", 0),
                        "price_change_7d": market_data_raw.get("price_change_percentage_7d", 0),
                        "price_change_30d": market_data_raw.get("price_change_percentage_30d", 0),
                        
                        # Volume and liquidity
                        "volume_24h": market_data_raw.get("total_volume", {}).get("usd", 0),
                        "volume_change_24h": market_data_raw.get("volume_change_24h", 0),
                        "market_cap": market_data_raw.get("market_cap", {}).get("usd", 0),
                        "market_cap_rank": data.get("market_cap_rank", 0),
                        "circulating_supply": market_data_raw.get("circulating_supply", 0),
                        "total_supply": market_data_raw.get("total_supply", 0),
                        
                        # Price extremes
                        "high_24h": market_data_raw.get("high_24h", {}).get("usd", 0),
                        "low_24h": market_data_raw.get("low_24h", {}).get("usd", 0),
                        "ath": market_data_raw.get("ath", {}).get("usd", 0),
                        "ath_change_percentage": market_data_raw.get("ath_change_percentage", {}).get("usd", 0),
                        "ath_date": market_data_raw.get("ath_date", {}).get("usd", ""),
                        "atl": market_data_raw.get("atl", {}).get("usd", 0),
                        "atl_change_percentage": market_data_raw.get("atl_change_percentage", {}).get("usd", 0),
                        
                        # Technical indicators
                        "volatility": abs(market_data_raw.get("price_change_percentage_24h", 0)),
                        "price_volatility_7d": self._calculate_price_volatility(market_data_raw.get("sparkline_7d", {}).get("price", [])),
                        "rsi_14": self._calculate_rsi(market_data_raw.get("sparkline_7d", {}).get("price", [])),
                        "volume_to_market_cap": self._calculate_volume_ratio(
                            market_data_raw.get("total_volume", {}).get("usd", 0),
                            market_data_raw.get("market_cap", {}).get("usd", 0)
                        ),
                        
                        # Market sentiment
                        "sentiment_votes_up_percentage": data.get("sentiment_votes_up_percentage", 50),
                        "sentiment_votes_down_percentage": data.get("sentiment_votes_down_percentage", 50),
                        
                        # Liquidity metrics
                        "liquidity_score": data.get("liquidity_score", 0),
                        "coingecko_score": data.get("coingecko_score", 0),
                        "developer_score": data.get("developer_score", 0),
                        "community_score": data.get("community_score", 0),
                        
                        # Metadata
                        "last_updated": data.get("last_updated", ""),
                        "timestamp": datetime.now().isoformat(),
                        "data_source": "coingecko"
                    }
                    
                    # Add derived metrics
                    market_data.update(self._calculate_derived_metrics(market_data))
                    
                    cache.set(cache_key, market_data)
                    logger.info(f"Fetched comprehensive CoinGecko data for {coin_id}: ${market_data['price_usd']:.4f} (Vol: ${market_data['volume_24h']:,.0f})")
                    return market_data
                    
                elif response.status == 429:
                    logger.warning("CoinGecko API rate limit exceeded, using fallback data")
                    return self._get_fallback_coingecko_data()
                else:
                    logger.error(f"CoinGecko API error: {response.status}")
                    return self._get_fallback_coingecko_data()
                    
        except Exception as e:
            logger.error(f"Error fetching CoinGecko data: {e}")
            return self._get_fallback_coingecko_data()
    
    def _calculate_price_volatility(self, price_data: List[float]) -> float:
        """Calculate price volatility from sparkline data"""
        if not price_data or len(price_data) < 2:
            return 0.0
        
        try:
            import numpy as np
            returns = [((price_data[i] - price_data[i-1]) / price_data[i-1]) * 100 
                      for i in range(1, len(price_data)) if price_data[i-1] != 0]
            return float(np.std(returns)) if returns else 0.0
        except:
            # Fallback calculation without numpy
            if len(price_data) < 2:
                return 0.0
            returns = [((price_data[i] - price_data[i-1]) / price_data[i-1]) * 100 
                      for i in range(1, len(price_data)) if price_data[i-1] != 0]
            if not returns:
                return 0.0
            mean_return = sum(returns) / len(returns)
            variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
            return variance ** 0.5
    
    def _calculate_rsi(self, price_data: List[float], period: int = 14) -> float:
        """Calculate RSI (Relative Strength Index)"""
        if not price_data or len(price_data) < period + 1:
            return 50.0  # Neutral RSI
        
        try:
            gains = []
            losses = []
            
            for i in range(1, len(price_data)):
                change = price_data[i] - price_data[i-1]
                if change > 0:
                    gains.append(change)
                    losses.append(0)
                else:
                    gains.append(0)
                    losses.append(abs(change))
            
            if len(gains) < period:
                return 50.0
            
            avg_gain = sum(gains[-period:]) / period
            avg_loss = sum(losses[-period:]) / period
            
            if avg_loss == 0:
                return 100.0
            
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
            return max(0, min(100, rsi))
            
        except:
            return 50.0
    
    def _calculate_volume_ratio(self, volume_24h: float, market_cap: float) -> float:
        """Calculate volume to market cap ratio"""
        if market_cap == 0:
            return 0.0
        return (volume_24h / market_cap) * 100
    
    def _calculate_derived_metrics(self, market_data: Dict) -> Dict:
        """Calculate additional derived metrics"""
        try:
            price_usd = market_data.get("price_usd", 0)
            high_24h = market_data.get("high_24h", 0)
            low_24h = market_data.get("low_24h", 0)
            volume_24h = market_data.get("volume_24h", 0)
            market_cap = market_data.get("market_cap", 0)
            
            derived = {}
            
            # Price position in 24h range
            if high_24h > low_24h:
                derived["price_position_24h"] = ((price_usd - low_24h) / (high_24h - low_24h)) * 100
            else:
                derived["price_position_24h"] = 50.0
            
            # Liquidity depth estimate
            derived["liquidity_depth"] = volume_24h / max(price_usd, 1) if price_usd > 0 else 0
            
            # Market dominance approximation (assuming total crypto market cap ~2.5T)
            total_market_estimate = 2_500_000_000_000  # $2.5T
            derived["market_dominance"] = (market_cap / total_market_estimate) * 100 if market_cap > 0 else 0
            
            # Volatility classification
            volatility = market_data.get("volatility", 0)
            if volatility < 2:
                derived["volatility_class"] = "low"
            elif volatility < 5:
                derived["volatility_class"] = "moderate"
            elif volatility < 10:
                derived["volatility_class"] = "high"
            else:
                derived["volatility_class"] = "extreme"
            
            # Volume classification (relative to market cap)
            volume_ratio = derived.get("volume_to_market_cap", market_data.get("volume_to_market_cap", 0))
            if volume_ratio < 1:
                derived["volume_class"] = "low"
            elif volume_ratio < 5:
                derived["volume_class"] = "moderate"
            elif volume_ratio < 15:
                derived["volume_class"] = "high"
            else:
                derived["volume_class"] = "very_high"
            
            return derived
            
        except Exception as e:
            logger.warning(f"Error calculating derived metrics: {e}")
            return {}
    
    def _get_fallback_coingecko_data(self) -> Dict:
        """Provide fallback data when CoinGecko API fails"""
        return {
            "price_usd": 35.0,  # Approximate AVAX price fallback
            "price_change_1h": 0.0,
            "price_change_24h": 0.0,
            "price_change_7d": 0.0,
            "volume_24h": 400_000_000,  # Approximate daily volume
            "market_cap": 15_000_000_000,  # Approximate market cap
            "volatility": 3.0,
            "volume_to_market_cap": 2.67,
            "liquidity_score": 0,
            "timestamp": datetime.now().isoformat(),
            "data_source": "fallback",
            "volatility_class": "moderate",
            "volume_class": "moderate"
        }
    
    async def fetch_coingecko_multi_coins(self, coin_ids: List[str] = None) -> Dict[str, Dict]:
        """Fetch data for multiple coins efficiently using batch API"""
        if coin_ids is None:
            coin_ids = ["avalanche-2", "bitcoin", "ethereum", "solana"]
        
        cache_key = f"coingecko_multi_{'-'.join(coin_ids)}"
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug("Using cached CoinGecko multi-coin data")
            return cached_data
        
        try:
            url = f"{Config.COINGECKO_BASE_URL}/coins/markets"
            headers = {
                "Accept": "application/json",
                "User-Agent": "Aura-AI-DEX/1.0"
            }
            
            params = {
                "vs_currency": "usd",
                "ids": ",".join(coin_ids),
                "order": "market_cap_desc",
                "per_page": len(coin_ids),
                "page": 1,
                "sparkline": "true",
                "price_change_percentage": "1h,24h,7d,30d"
            }
            
            if Config.COINGECKO_API_KEY:
                headers["x-cg-demo-api-key"] = Config.COINGECKO_API_KEY
            
            async with self.session.get(url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    multi_coin_data = {}
                    for coin in data:
                        coin_id = coin.get("id", "unknown")
                        multi_coin_data[coin_id] = {
                            "symbol": coin.get("symbol", "").upper(),
                            "name": coin.get("name", ""),
                            "price_usd": coin.get("current_price", 0),
                            "price_change_1h": coin.get("price_change_percentage_1h", 0),
                            "price_change_24h": coin.get("price_change_percentage_24h", 0),
                            "price_change_7d": coin.get("price_change_percentage_7d", 0),
                            "price_change_30d": coin.get("price_change_percentage_30d", 0),
                            "volume_24h": coin.get("total_volume", 0),
                            "market_cap": coin.get("market_cap", 0),
                            "market_cap_rank": coin.get("market_cap_rank", 0),
                            "high_24h": coin.get("high_24h", 0),
                            "low_24h": coin.get("low_24h", 0),
                            "circulating_supply": coin.get("circulating_supply", 0),
                            "total_supply": coin.get("total_supply", 0),
                            "max_supply": coin.get("max_supply", 0),
                            "ath": coin.get("ath", 0),
                            "ath_change_percentage": coin.get("ath_change_percentage", 0),
                            "volatility": abs(coin.get("price_change_percentage_24h", 0)),
                            "volume_to_market_cap": self._calculate_volume_ratio(
                                coin.get("total_volume", 0),
                                coin.get("market_cap", 0)
                            ),
                            "price_volatility_7d": self._calculate_price_volatility(
                                coin.get("sparkline_in_7d", {}).get("price", [])
                            ),
                            "last_updated": coin.get("last_updated", ""),
                            "timestamp": datetime.now().isoformat(),
                            "data_source": "coingecko_markets"
                        }
                    
                    cache.set(cache_key, multi_coin_data)
                    logger.info(f"Fetched multi-coin data for {len(multi_coin_data)} coins")
                    return multi_coin_data
                    
                else:
                    logger.error(f"CoinGecko markets API error: {response.status}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Error fetching multi-coin data: {e}")
            return {}
    
    async def fetch_coingecko_global_data(self) -> Optional[Dict]:
        """Fetch global cryptocurrency market data"""
        cache_key = "coingecko_global"
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug("Using cached CoinGecko global data")
            return cached_data
        
        try:
            url = f"{Config.COINGECKO_BASE_URL}/global"
            headers = {
                "Accept": "application/json",
                "User-Agent": "Aura-AI-DEX/1.0"
            }
            
            if Config.COINGECKO_API_KEY:
                headers["x-cg-demo-api-key"] = Config.COINGECKO_API_KEY
            
            async with self.session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    global_data_raw = data.get("data", {})
                    
                    global_data = {
                        "total_market_cap_usd": global_data_raw.get("total_market_cap", {}).get("usd", 0),
                        "total_volume_24h_usd": global_data_raw.get("total_volume", {}).get("usd", 0),
                        "market_cap_percentage": global_data_raw.get("market_cap_percentage", {}),
                        "market_cap_change_24h": global_data_raw.get("market_cap_change_percentage_24h_usd", 0),
                        "active_cryptocurrencies": global_data_raw.get("active_cryptocurrencies", 0),
                        "ongoing_icos": global_data_raw.get("ongoing_icos", 0),
                        "ended_icos": global_data_raw.get("ended_icos", 0),
                        "markets": global_data_raw.get("markets", 0),
                        "updated_at": global_data_raw.get("updated_at", 0),
                        "timestamp": datetime.now().isoformat(),
                        "data_source": "coingecko_global"
                    }
                    
                    # Calculate market sentiment
                    btc_dominance = global_data["market_cap_percentage"].get("btc", 0)
                    eth_dominance = global_data["market_cap_percentage"].get("eth", 0)
                    
                    global_data["market_sentiment"] = self._analyze_market_sentiment(
                        btc_dominance, eth_dominance, global_data["market_cap_change_24h"]
                    )
                    
                    cache.set(cache_key, global_data)
                    logger.info(f"Fetched global market data: ${global_data['total_market_cap_usd']:,.0f} total market cap")
                    return global_data
                    
                else:
                    logger.error(f"CoinGecko global API error: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error fetching global data: {e}")
            return None
    
    def _analyze_market_sentiment(self, btc_dominance: float, eth_dominance: float, market_change: float) -> str:
        """Analyze overall market sentiment based on dominance and changes"""
        if market_change > 5:
            return "bullish"
        elif market_change < -5:
            return "bearish"
        elif btc_dominance > 50:
            return "risk_off"
        elif btc_dominance < 40:
            return "risk_on"
        else:
            return "neutral"

    async def fetch_pyth_price_data(self, symbol: str = "AVAX/USD") -> Optional[Dict]:
        """Fetch real-time price data from Pyth Network using modern v2 API"""
        cache_key = f"pyth_{symbol}"
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug(f"Using cached Pyth data for {symbol}")
            return cached_data
        
        try:
            # Step 1: Get AVAX price feed ID from the v2/price_feeds endpoint
            feeds_url = "https://hermes.pyth.network/v2/price_feeds"
            params = {
                "query": "AVAX",
                "asset_type": "crypto"
            }
            
            async with self.session.get(feeds_url, params=params) as response:
                if response.status == 200:
                    feeds = await response.json()
                    
                    # Find AVAX/USD feed
                    avax_feed = None
                    for feed in feeds:
                        attrs = feed.get("attributes", {})
                        base = attrs.get("base", "").upper()
                        quote = attrs.get("quote_currency", "").upper()
                        if "AVAX" in base and "USD" in quote:
                            avax_feed = feed
                            break
                    
                    if not avax_feed:
                        logger.error("AVAX/USD feed not found in Pyth price feeds")
                        return None
                    
                    feed_id = avax_feed["id"]
                    
                    # Step 2: Get latest price data using the feed ID
                    price_url = "https://hermes.pyth.network/v2/updates/price/latest"
                    price_params = {
                        "ids[]": feed_id,
                        "encoding": "hex"
                    }
                    
                    async with self.session.get(price_url, params=price_params) as price_response:
                        if price_response.status == 200:
                            price_data = await price_response.json()
                            
                            if price_data and "parsed" in price_data and len(price_data["parsed"]) > 0:
                                parsed_feed = price_data["parsed"][0]
                                price_info = parsed_feed["price"]
                                
                                price = int(price_info["price"])
                                expo = int(price_info["expo"])
                                confidence = int(price_info["conf"])
                                
                                # Calculate actual price (Pyth prices use scaled integers)
                                actual_price = price * (10 ** expo)
                                confidence_interval = confidence * (10 ** expo)
                                
                                pyth_data = {
                                    "symbol": symbol,
                                    "price": actual_price,
                                    "confidence": confidence_interval,
                                    "confidence_ratio": confidence_interval / abs(actual_price) if actual_price != 0 else 0,
                                    "publish_time": price_info["publish_time"],
                                    "feed_id": feed_id,
                                    "base": avax_feed["attributes"].get("base", "AVAX"),
                                    "quote": avax_feed["attributes"].get("quote_currency", "USD"),
                                    "timestamp": datetime.now().isoformat()
                                }
                                
                                cache.set(cache_key, pyth_data)
                                logger.info(f"Fetched Pyth data for {symbol}: ${actual_price:.4f} (±{confidence_interval:.4f})")
                                return pyth_data
                            else:
                                logger.error("No parsed price data in Pyth response")
                                return None
                        else:
                            logger.error(f"Pyth price API error: {price_response.status}")
                            return None
                else:
                    logger.error(f"Pyth feeds API error: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error fetching Pyth data: {e}")
            return None
    
    async def fetch_avalanche_network_stats(self) -> Optional[Dict]:
        """Fetch Avalanche network statistics via RPC"""
        cache_key = "avalanche_stats"
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug("Using cached Avalanche network stats")
            return cached_data
        
        try:
            # Fetch basic network info
            payload = {
                "jsonrpc": "2.0",
                "method": "eth_blockNumber",
                "params": [],
                "id": 1
            }
            
            async with self.session.post(Config.AVALANCHE_RPC_URL, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    block_number = int(data["result"], 16)
                    
                    # Fetch gas price
                    gas_payload = {
                        "jsonrpc": "2.0",
                        "method": "eth_gasPrice",
                        "params": [],
                        "id": 2
                    }
                    
                    async with self.session.post(Config.AVALANCHE_RPC_URL, json=gas_payload) as gas_response:
                        gas_data = await gas_response.json()
                        gas_price = int(gas_data["result"], 16)
                        
                        network_stats = {
                            "block_number": block_number,
                            "gas_price_wei": gas_price,
                            "gas_price_gwei": gas_price / 1e9,
                            "network_congestion": "low" if gas_price < 25e9 else "high",
                            "timestamp": datetime.now().isoformat()
                        }
                        
                        cache.set(cache_key, network_stats)
                        logger.info(f"Fetched Avalanche stats: Block {block_number}, Gas {network_stats['gas_price_gwei']:.2f} GWEI")
                        return network_stats
                else:
                    logger.error(f"Avalanche RPC error: {response.status}")
                    return None
        except Exception as e:
            logger.error(f"Error fetching Avalanche stats: {e}")
            return None
    
    async def get_comprehensive_market_data(self) -> Dict:
        """Fetch all market data concurrently with enhanced CoinGecko integration"""
        try:
            # Fetch all data sources concurrently
            tasks = [
                self.fetch_coingecko_data(),
                self.fetch_coingecko_global_data(),
                self.fetch_pyth_price_data(),
                self.fetch_avalanche_network_stats(),
                self.fetch_coingecko_multi_coins(["avalanche-2", "bitcoin", "ethereum"])
            ]
            
            (coingecko_data, global_data, pyth_data, 
             network_stats, multi_coin_data) = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Combine data, handling exceptions
            combined_data = {
                "timestamp": datetime.now().isoformat(),
                "coingecko": coingecko_data if not isinstance(coingecko_data, Exception) else None,
                "coingecko_global": global_data if not isinstance(global_data, Exception) else None,
                "multi_coins": multi_coin_data if not isinstance(multi_coin_data, Exception) else {},
                "pyth": pyth_data if not isinstance(pyth_data, Exception) else None,
                "network": network_stats if not isinstance(network_stats, Exception) else None
            }
            
            # Calculate enhanced market indicators
            if combined_data["coingecko"]:
                combined_data["market_indicators"] = self._calculate_enhanced_market_indicators(combined_data)
            
            # Add cross-asset analysis
            if combined_data["multi_coins"]:
                combined_data["cross_asset_analysis"] = self._analyze_cross_asset_correlations(combined_data["multi_coins"])
            
            # Add market regime detection
            combined_data["market_regime"] = self._detect_market_regime(combined_data)
            
            return combined_data
            
        except Exception as e:
            logger.error(f"Error fetching comprehensive market data: {e}")
            return {"timestamp": datetime.now().isoformat(), "error": str(e)}
    
    def _calculate_enhanced_market_indicators(self, data: Dict) -> Dict:
        """Calculate enhanced market indicators from all data sources"""
        coingecko = data.get("coingecko", {})
        global_data = data.get("coingecko_global", {})
        network = data.get("network", {})
        
        if not coingecko:
            return {}
        
        volatility = coingecko.get("volatility", 0)
        volume_24h = coingecko.get("volume_24h", 0)
        market_cap = coingecko.get("market_cap", 0)
        rsi = coingecko.get("rsi_14", 50)
        price_position = coingecko.get("price_position_24h", 50)
        
        # Enhanced indicators
        indicators = {
            # Basic classifications
            "volatility_category": self._categorize_volatility(volatility),
            "volume_category": self._categorize_volume(volume_24h),
            "market_health": "healthy" if volatility < Config.VOLATILITY_THRESHOLD else "volatile",
            
            # Technical indicators
            "rsi_signal": self._interpret_rsi(rsi),
            "price_position_signal": self._interpret_price_position(price_position),
            "trend_direction": self._determine_trend_direction(coingecko),
            
            # Liquidity and depth
            "liquidity_depth_estimate": volume_24h / max(market_cap, 1) * 100,
            "liquidity_tier": self._classify_liquidity_tier(volume_24h, market_cap),
            
            # Network conditions
            "network_congestion": self._analyze_network_congestion(network),
            
            # Global market context
            "global_sentiment": global_data.get("market_sentiment", "neutral") if global_data else "unknown",
            "market_dominance": self._calculate_relative_dominance(coingecko, global_data),
            
            # Fee recommendations
            "recommended_fee_adjustment": self._calculate_advanced_fee_adjustment(volatility, volume_24h, rsi, network),
            "confidence_score": self._calculate_recommendation_confidence(coingecko, global_data, network)
        }
        
        return indicators
    
    def _analyze_cross_asset_correlations(self, multi_coins: Dict) -> Dict:
        """Analyze correlations between different assets"""
        if len(multi_coins) < 2:
            return {}
        
        try:
            correlations = {}
            coins = list(multi_coins.keys())
            
            # Calculate price change correlations
            for i, coin1 in enumerate(coins):
                for coin2 in coins[i+1:]:
                    if coin1 in multi_coins and coin2 in multi_coins:
                        change1 = multi_coins[coin1].get("price_change_24h", 0)
                        change2 = multi_coins[coin2].get("price_change_24h", 0)
                        
                        # Simple correlation approximation based on direction
                        if abs(change1) > 0.1 and abs(change2) > 0.1:
                            correlation = "positive" if (change1 > 0) == (change2 > 0) else "negative"
                        else:
                            correlation = "neutral"
                        
                        correlations[f"{coin1}_{coin2}"] = {
                            "correlation": correlation,
                            "change1": change1,
                            "change2": change2
                        }
            
            # Market leadership analysis
            avax_data = multi_coins.get("avalanche-2", {})
            btc_data = multi_coins.get("bitcoin", {})
            eth_data = multi_coins.get("ethereum", {})
            
            leadership = "unknown"
            if avax_data and btc_data:
                avax_change = avax_data.get("price_change_24h", 0)
                btc_change = btc_data.get("price_change_24h", 0)
                
                if abs(avax_change) > abs(btc_change) * 1.5:
                    leadership = "avax_leading"
                elif abs(btc_change) > abs(avax_change) * 1.5:
                    leadership = "btc_leading"
                else:
                    leadership = "moving_together"
            
            return {
                "correlations": correlations,
                "market_leadership": leadership,
                "relative_strength": self._calculate_relative_strength(multi_coins)
            }
            
        except Exception as e:
            logger.warning(f"Error analyzing cross-asset correlations: {e}")
            return {}
    
    def _detect_market_regime(self, data: Dict) -> str:
        """Detect current market regime for adaptive strategies"""
        coingecko = data.get("coingecko", {})
        global_data = data.get("coingecko_global", {})
        multi_coins = data.get("multi_coins", {})
        
        if not coingecko:
            return "unknown"
        
        volatility = coingecko.get("volatility", 0)
        volume_ratio = coingecko.get("volume_to_market_cap", 0)
        rsi = coingecko.get("rsi_14", 50)
        
        # Regime classification
        if volatility > 15 and volume_ratio > 10:
            return "crisis"
        elif volatility > 8 and rsi > 70:
            return "bubble"
        elif volatility > 8 and rsi < 30:
            return "crash"
        elif volatility < 3 and volume_ratio < 2:
            return "accumulation"
        elif volatility < 5 and 30 < rsi < 70:
            return "trending"
        elif volatility > 5:
            return "volatile"
        else:
            return "stable"
    
    def _interpret_rsi(self, rsi: float) -> str:
        """Interpret RSI values"""
        if rsi > 70:
            return "overbought"
        elif rsi < 30:
            return "oversold"
        elif rsi > 60:
            return "bullish"
        elif rsi < 40:
            return "bearish"
        else:
            return "neutral"
    
    def _interpret_price_position(self, position: float) -> str:
        """Interpret price position in 24h range"""
        if position > 80:
            return "near_high"
        elif position < 20:
            return "near_low"
        elif position > 60:
            return "upper_range"
        elif position < 40:
            return "lower_range"
        else:
            return "mid_range"
    
    def _determine_trend_direction(self, coingecko: Dict) -> str:
        """Determine trend direction from multiple timeframes"""
        change_1h = coingecko.get("price_change_1h", 0)
        change_24h = coingecko.get("price_change_24h", 0)
        change_7d = coingecko.get("price_change_7d", 0)
        
        # Weight different timeframes
        short_term = change_1h * 0.2 + change_24h * 0.8
        medium_term = change_7d
        
        if short_term > 2 and medium_term > 5:
            return "strong_uptrend"
        elif short_term > 0.5 and medium_term > 0:
            return "uptrend"
        elif short_term < -2 and medium_term < -5:
            return "strong_downtrend"
        elif short_term < -0.5 and medium_term < 0:
            return "downtrend"
        else:
            return "sideways"
    
    def _classify_liquidity_tier(self, volume_24h: float, market_cap: float) -> str:
        """Classify liquidity tier"""
        if volume_24h > 1_000_000_000:  # > $1B
            return "tier_1"
        elif volume_24h > 100_000_000:  # > $100M
            return "tier_2"
        elif volume_24h > 10_000_000:   # > $10M
            return "tier_3"
        else:
            return "tier_4"
    
    def _analyze_network_congestion(self, network: Dict) -> str:
        """Analyze network congestion from gas data"""
        if not network:
            return "unknown"
        
        gas_price = network.get("gas_price_gwei", 25)
        
        if gas_price > 100:
            return "severe"
        elif gas_price > 50:
            return "high"
        elif gas_price > 30:
            return "moderate"
        else:
            return "low"
    
    def _calculate_relative_dominance(self, coingecko: Dict, global_data: Dict) -> float:
        """Calculate AVAX's relative market dominance"""
        if not global_data or not coingecko:
            return 0.0
        
        avax_market_cap = coingecko.get("market_cap", 0)
        total_market_cap = global_data.get("total_market_cap_usd", 1)
        
        return (avax_market_cap / total_market_cap) * 100 if total_market_cap > 0 else 0.0
    
    def _calculate_advanced_fee_adjustment(self, volatility: float, volume_24h: float, rsi: float, network: Dict) -> float:
        """Calculate advanced fee adjustment using multiple factors"""
        base_fee = Config.BASE_FEE_RATE
        
        # Volatility adjustment
        vol_adjustment = 0
        if volatility > 15:
            vol_adjustment = 0.5
        elif volatility > 8:
            vol_adjustment = 0.2
        elif volatility < 2:
            vol_adjustment = -0.1
        
        # Volume adjustment
        volume_adjustment = 0
        if volume_24h > 1_000_000_000:
            volume_adjustment = -0.1
        elif volume_24h < 100_000_000:
            volume_adjustment = 0.1
        
        # RSI adjustment
        rsi_adjustment = 0
        if rsi > 80 or rsi < 20:  # Extreme levels
            rsi_adjustment = 0.1
        
        # Network congestion
        network_adjustment = 0
        if network:
            gas_price = network.get("gas_price_gwei", 25)
            if gas_price > 50:
                network_adjustment = 0.1
            elif gas_price < 20:
                network_adjustment = -0.05
        
        total_adjustment = vol_adjustment + volume_adjustment + rsi_adjustment + network_adjustment
        return max(0.05, min(base_fee + total_adjustment, 2.0))
    
    def _calculate_recommendation_confidence(self, coingecko: Dict, global_data: Dict, network: Dict) -> float:
        """Calculate confidence in recommendations"""
        confidence = 0.7  # Base confidence
        
        # Data availability boost
        if coingecko:
            confidence += 0.1
        if global_data:
            confidence += 0.05
        if network:
            confidence += 0.05
        
        # Data quality assessment
        if coingecko:
            price = coingecko.get("price_usd", 0)
            volume = coingecko.get("volume_24h", 0)
            
            if price > 0 and volume > 1_000_000:  # Reasonable data
                confidence += 0.1
            
            # Reduce confidence for extreme volatility
            volatility = coingecko.get("volatility", 0)
            if volatility > 20:
                confidence -= 0.1
        
        return max(0.3, min(confidence, 0.95))
    
    def _calculate_relative_strength(self, multi_coins: Dict) -> Dict:
        """Calculate relative strength compared to major assets"""
        if "avalanche-2" not in multi_coins:
            return {}
        
        avax = multi_coins["avalanche-2"]
        avax_change = avax.get("price_change_24h", 0)
        
        relative_strength = {}
        
        for coin_id, coin_data in multi_coins.items():
            if coin_id != "avalanche-2":
                coin_change = coin_data.get("price_change_24h", 0)
                relative_strength[coin_id] = avax_change - coin_change
        
        return relative_strength

    def _calculate_market_indicators(self, data: Dict) -> Dict:
        """Calculate additional market indicators from fetched data"""
        coingecko = data.get("coingecko", {})
        
        if not coingecko:
            return {}
        
        volatility = coingecko.get("volatility", 0)
        volume_24h = coingecko.get("volume_24h", 0)
        market_cap = coingecko.get("market_cap", 0)
        
        # Calculate market indicators
        indicators = {
            "volatility_category": self._categorize_volatility(volatility),
            "volume_category": self._categorize_volume(volume_24h),
            "market_health": "healthy" if volatility < Config.VOLATILITY_THRESHOLD else "volatile",
            "liquidity_depth_estimate": volume_24h / max(market_cap, 1) * 100,  # Volume to market cap ratio
            "recommended_fee_adjustment": self._calculate_fee_adjustment(volatility)
        }
        
        return indicators
    
    def _categorize_volatility(self, volatility: float) -> str:
        """Categorize market volatility"""
        if volatility < 2:
            return "low"
        elif volatility < 5:
            return "medium"
        elif volatility < 10:
            return "high"
        else:
            return "extreme"
    
    def _categorize_volume(self, volume: float) -> str:
        """Categorize trading volume"""
        if volume < 100_000_000:  # < 100M
            return "low"
        elif volume < 500_000_000:  # < 500M
            return "medium"
        elif volume < 1_000_000_000:  # < 1B
            return "high"
        else:
            return "very_high"
    
    def _calculate_fee_adjustment(self, volatility: float) -> float:
        """Calculate recommended fee adjustment based on volatility"""
        base_fee = Config.BASE_FEE_RATE
        
        if volatility > Config.VOLATILITY_THRESHOLD:
            # Increase fee by 0.2% for every 3% of volatility above threshold
            multiplier = (volatility - Config.VOLATILITY_THRESHOLD) / 3.0
            adjustment = 0.2 * multiplier
            return min(base_fee + adjustment, 2.0)  # Cap at 2%
        
        return base_fee

# Utility functions for external use
async def get_live_market_data() -> Dict:
    """Get live market data - main entry point"""
    async with OracleDataPipeline() as pipeline:
        return await pipeline.get_comprehensive_market_data()

async def get_enhanced_coingecko_data(coin_id: str = "avalanche-2") -> Optional[Dict]:
    """Get enhanced CoinGecko data for a specific coin"""
    async with OracleDataPipeline() as pipeline:
        return await pipeline.fetch_coingecko_data(coin_id)

async def get_multi_coin_data(coin_ids: List[str] = None) -> Dict:
    """Get data for multiple coins"""
    async with OracleDataPipeline() as pipeline:
        return await pipeline.fetch_coingecko_multi_coins(coin_ids)

async def get_global_market_data() -> Optional[Dict]:
    """Get global cryptocurrency market data"""
    async with OracleDataPipeline() as pipeline:
        return await pipeline.fetch_coingecko_global_data()

async def get_avax_price() -> Optional[float]:
    """Get current AVAX price"""
    async with OracleDataPipeline() as pipeline:
        coingecko_data = await pipeline.fetch_coingecko_data()
        if coingecko_data:
            return coingecko_data.get("price_usd")
        return None

async def get_volatility() -> Optional[float]:
    """Get current AVAX volatility"""
    async with OracleDataPipeline() as pipeline:
        coingecko_data = await pipeline.fetch_coingecko_data()
        if coingecko_data:
            return coingecko_data.get("volatility")
        return None

async def get_market_sentiment() -> str:
    """Get overall market sentiment"""
    async with OracleDataPipeline() as pipeline:
        global_data = await pipeline.fetch_coingecko_global_data()
        if global_data:
            return global_data.get("market_sentiment", "neutral")
        return "unknown"

async def get_cross_asset_analysis() -> Dict:
    """Get cross-asset correlation analysis"""
    async with OracleDataPipeline() as pipeline:
        multi_coin_data = await pipeline.fetch_coingecko_multi_coins()
        if multi_coin_data:
            return pipeline._analyze_cross_asset_correlations(multi_coin_data)
        return {}

# Test function
async def test_pipeline():
    """Test the data pipeline"""
    print("Testing Aura AI Data Pipeline...")
    
    async with OracleDataPipeline() as pipeline:
        print("\n1. Testing CoinGecko integration...")
        coingecko_data = await pipeline.fetch_coingecko_data()
        print(f"CoinGecko data: {coingecko_data}")
        
        print("\n2. Testing Pyth integration...")
        pyth_data = await pipeline.fetch_pyth_price_data()
        print(f"Pyth data: {pyth_data}")
        
        print("\n3. Testing Avalanche RPC...")
        network_stats = await pipeline.fetch_avalanche_network_stats()
        print(f"Network stats: {network_stats}")
        
        print("\n4. Testing comprehensive data fetch...")
        comprehensive_data = await pipeline.get_comprehensive_market_data()
        print(f"Comprehensive data: {json.dumps(comprehensive_data, indent=2)}")

if __name__ == "__main__":
    asyncio.run(test_pipeline())