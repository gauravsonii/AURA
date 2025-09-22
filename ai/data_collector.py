"""
Historical Data Collection Pipeline for Aura AI Backend
Collects and stores training data from multiple sources
"""
import asyncio
import aiohttp
import pandas as pd
import numpy as np
import sqlite3
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import time
import os

from config import Config

logger = logging.getLogger(__name__)

class HistoricalDataCollector:
    """Collects historical market data for ML training"""
    
    def __init__(self, db_path: str = "data/historical_data.db"):
        self.db_path = db_path
        self.session = None
        
        # Create data directory
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # Initialize database
        self._init_database()
    
    def _init_database(self):
        """Initialize SQLite database for storing historical data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS market_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                symbol TEXT,
                price_usd REAL,
                volume_24h REAL,
                market_cap REAL,
                price_change_1h REAL,
                price_change_24h REAL,
                volatility REAL,
                source TEXT,
                raw_data TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS network_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                block_number INTEGER,
                gas_price_gwei REAL,
                transaction_count INTEGER,
                network_congestion_score REAL,
                source TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trading_outcomes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                fee_used REAL,
                transaction_success BOOLEAN,
                gas_used INTEGER,
                execution_time_seconds REAL,
                slippage_experienced REAL,
                market_conditions TEXT
            )
        ''')
        
        # Create indexes for better query performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_market_timestamp ON market_data(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_network_timestamp ON network_data(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_trading_timestamp ON trading_outcomes(timestamp)')
        
        conn.commit()
        conn.close()
        
        logger.info("Historical data database initialized")
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def collect_historical_coingecko_data(self, 
                                              symbol: str = "avalanche-2", 
                                              days: int = 365) -> List[Dict]:
        """Collect historical data from CoinGecko"""
        logger.info(f"Collecting {days} days of historical data for {symbol}")
        
        historical_data = []
        
        try:
            # Get historical price data
            url = f"{Config.COINGECKO_BASE_URL}/coins/{symbol}/market_chart"
            params = {
                "vs_currency": "usd",
                "days": days,
                "interval": "hourly" if days <= 90 else "daily"
            }
            
            if Config.COINGECKO_API_KEY:
                params["x_cg_demo_api_key"] = Config.COINGECKO_API_KEY
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    prices = data.get("prices", [])
                    volumes = data.get("total_volumes", [])
                    market_caps = data.get("market_caps", [])
                    
                    # Process each data point
                    for i, (timestamp_ms, price) in enumerate(prices):
                        timestamp = datetime.fromtimestamp(timestamp_ms / 1000)
                        
                        volume = volumes[i][1] if i < len(volumes) else 0
                        market_cap = market_caps[i][1] if i < len(market_caps) else 0
                        
                        # Calculate price changes and volatility
                        price_change_1h = 0
                        price_change_24h = 0
                        volatility = 0
                        
                        if i > 0:
                            prev_price = prices[i-1][1]
                            price_change_1h = ((price - prev_price) / prev_price * 100) if prev_price > 0 else 0
                        
                        if i >= 24:  # 24 hours of hourly data
                            price_24h_ago = prices[i-24][1]
                            price_change_24h = ((price - price_24h_ago) / price_24h_ago * 100) if price_24h_ago > 0 else 0
                        
                        # Calculate volatility as standard deviation of recent price changes
                        if i >= 24:
                            recent_prices = [p[1] for p in prices[max(0, i-23):i+1]]
                            returns = [(recent_prices[j] - recent_prices[j-1]) / recent_prices[j-1] 
                                     for j in range(1, len(recent_prices))]
                            volatility = np.std(returns) * 100 if returns else 0
                        
                        data_point = {
                            "timestamp": timestamp,
                            "symbol": symbol,
                            "price_usd": price,
                            "volume_24h": volume,
                            "market_cap": market_cap,
                            "price_change_1h": price_change_1h,
                            "price_change_24h": price_change_24h,
                            "volatility": volatility,
                            "source": "coingecko_historical"
                        }
                        
                        historical_data.append(data_point)
                        
                        # Add delay to respect rate limits
                        if i % 100 == 0:
                            await asyncio.sleep(0.1)
                
                logger.info(f"Collected {len(historical_data)} historical data points")
                return historical_data
                
        except Exception as e:
            logger.error(f"Error collecting historical CoinGecko data: {e}")
            return []
    
    async def collect_avalanche_historical_network_data(self, days: int = 30) -> List[Dict]:
        """Collect historical Avalanche network data"""
        logger.info(f"Collecting {days} days of network data")
        
        network_data = []
        
        try:
            # For demo purposes, generate realistic network data
            # In production, this would query actual blockchain data
            
            start_time = datetime.now() - timedelta(days=days)
            
            for i in range(days * 24):  # Hourly data
                timestamp = start_time + timedelta(hours=i)
                
                # Simulate realistic network conditions
                base_block = 69000000 + i * 60  # ~60 blocks per hour
                
                # Gas price varies with time of day and randomness
                hour = timestamp.hour
                day_of_week = timestamp.weekday()
                
                # Base gas price with patterns
                if hour in [9, 10, 16, 17]:  # Peak hours
                    base_gas = 35
                elif hour in [2, 3, 4, 5]:  # Low activity
                    base_gas = 20
                else:
                    base_gas = 25
                
                # Weekend vs weekday
                if day_of_week in [5, 6]:  # Weekend
                    base_gas *= 0.8
                
                # Add randomness
                gas_price = base_gas * np.random.uniform(0.7, 1.8)
                gas_price = max(15, min(gas_price, 200))
                
                # Transaction count correlates with gas price
                tx_count = int(1000 + gas_price * 50 + np.random.normal(0, 200))
                tx_count = max(500, tx_count)
                
                # Network congestion score
                congestion_score = min((gas_price - 15) / 185 * 100, 100)
                
                network_point = {
                    "timestamp": timestamp,
                    "block_number": base_block,
                    "gas_price_gwei": gas_price,
                    "transaction_count": tx_count,
                    "network_congestion_score": congestion_score,
                    "source": "avalanche_simulated"
                }
                
                network_data.append(network_point)
            
            logger.info(f"Generated {len(network_data)} network data points")
            return network_data
            
        except Exception as e:
            logger.error(f"Error collecting network data: {e}")
            return []
    
    def store_market_data(self, data: List[Dict]):
        """Store market data in database"""
        if not data:
            return
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for point in data:
            cursor.execute('''
                INSERT OR REPLACE INTO market_data 
                (timestamp, symbol, price_usd, volume_24h, market_cap, 
                 price_change_1h, price_change_24h, volatility, source, raw_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                point["timestamp"],
                point["symbol"],
                point["price_usd"],
                point["volume_24h"],
                point["market_cap"],
                point["price_change_1h"],
                point["price_change_24h"],
                point["volatility"],
                point["source"],
                json.dumps(point)
            ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Stored {len(data)} market data points")
    
    def store_network_data(self, data: List[Dict]):
        """Store network data in database"""
        if not data:
            return
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for point in data:
            cursor.execute('''
                INSERT OR REPLACE INTO network_data 
                (timestamp, block_number, gas_price_gwei, transaction_count, 
                 network_congestion_score, source)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                point["timestamp"],
                point["block_number"],
                point["gas_price_gwei"],
                point["transaction_count"],
                point["network_congestion_score"],
                point["source"]
            ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Stored {len(data)} network data points")
    
    def get_training_dataset(self, days: int = 365) -> pd.DataFrame:
        """Get combined training dataset from stored data"""
        conn = sqlite3.connect(self.db_path)
        
        # Query to join market and network data by timestamp
        query = '''
        SELECT 
            m.timestamp,
            m.price_usd,
            m.volume_24h,
            m.market_cap,
            m.price_change_1h,
            m.price_change_24h,
            m.volatility,
            n.gas_price_gwei,
            n.network_congestion_score,
            n.transaction_count
        FROM market_data m
        LEFT JOIN network_data n ON 
            datetime(m.timestamp) = datetime(n.timestamp)
        WHERE m.timestamp >= datetime('now', '-{} days')
        ORDER BY m.timestamp
        '''.format(days)
        
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        if df.empty:
            logger.warning("No training data found in database")
            return df
        
        # Clean and process data
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.fillna(method='forward').fillna(method='backward')  # Fill missing values
        
        # Add time-based features
        df['hour_of_day'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        
        # Add technical indicators
        df['price_ma_7d'] = df['price_usd'].rolling(window=168, min_periods=1).mean()  # 7 days hourly
        df['volume_ma_7d'] = df['volume_24h'].rolling(window=168, min_periods=1).mean()
        df['volatility_ma_7d'] = df['volatility'].rolling(window=168, min_periods=1).mean()
        
        # Calculate additional features
        df['liquidity_score'] = (df['volume_24h'] / df['market_cap']) * 100
        df['price_momentum'] = df['price_change_24h'] * 1.2  # Simplified momentum
        df['volume_ratio'] = df['volume_24h'] / df['volume_ma_7d']
        df['gas_trend'] = (df['gas_price_gwei'] - 25) / 275
        
        # Remove rows with NaN values
        df = df.dropna()
        
        logger.info(f"Prepared training dataset with {len(df)} samples")
        return df
    
    def add_optimal_fee_labels(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add optimal fee labels to the dataset"""
        if df.empty:
            return df
        
        optimal_fees = []
        
        for _, row in df.iterrows():
            # Calculate optimal fee based on sophisticated logic
            base_fee = Config.BASE_FEE_RATE
            
            # Volatility factor
            volatility = row.get('volatility', 0)
            if volatility > 10:
                volatility_factor = 1 + (volatility - 10) ** 1.2 * 0.05
            elif volatility < 2:
                volatility_factor = 0.8
            else:
                volatility_factor = 1 + (volatility - 5) * 0.02
            
            # Volume factor
            volume_ratio = row.get('volume_ratio', 1)
            if volume_ratio > 1.2:
                volume_factor = 0.9
            elif volume_ratio < 0.8:
                volume_factor = 1.1
            else:
                volume_factor = 1.0
            
            # Gas factor
            gas_trend = row.get('gas_trend', 0)
            gas_factor = 1 + gas_trend * 0.3
            
            # Time factor
            hour = row.get('hour_of_day', 12)
            if hour in [9, 10, 16, 17]:
                time_factor = 1.1
            elif hour in [2, 3, 4, 5]:
                time_factor = 0.9
            else:
                time_factor = 1.0
            
            # Liquidity factor
            liquidity_score = row.get('liquidity_score', 1)
            if liquidity_score > 5:
                liquidity_factor = 0.95
            elif liquidity_score < 1:
                liquidity_factor = 1.15
            else:
                liquidity_factor = 1.0
            
            # Calculate optimal fee
            optimal_fee = base_fee * volatility_factor * volume_factor * gas_factor * time_factor * liquidity_factor
            
            # Add some noise for realism
            noise = np.random.normal(0, 0.02)
            optimal_fee += noise
            
            # Clamp to reasonable bounds
            optimal_fee = max(0.05, min(optimal_fee, 3.0))
            optimal_fees.append(optimal_fee)
        
        df['optimal_fee'] = optimal_fees
        return df
    
    async def collect_and_store_all_data(self, days: int = 365):
        """Collect and store all historical data"""
        logger.info("Starting comprehensive data collection...")
        
        # Collect market data
        market_data = await self.collect_historical_coingecko_data(days=days)
        self.store_market_data(market_data)
        
        # Collect network data
        network_data = await self.collect_avalanche_historical_network_data(days=min(days, 90))
        self.store_network_data(network_data)
        
        logger.info("Data collection completed")
    
    def get_data_summary(self) -> Dict:
        """Get summary of stored data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Market data summary
        cursor.execute('SELECT COUNT(*), MIN(timestamp), MAX(timestamp) FROM market_data')
        market_count, market_min, market_max = cursor.fetchone()
        
        # Network data summary
        cursor.execute('SELECT COUNT(*), MIN(timestamp), MAX(timestamp) FROM network_data')
        network_count, network_min, network_max = cursor.fetchone()
        
        conn.close()
        
        return {
            "market_data": {
                "count": market_count or 0,
                "date_range": f"{market_min} to {market_max}" if market_min else "No data"
            },
            "network_data": {
                "count": network_count or 0,
                "date_range": f"{network_min} to {network_max}" if network_min else "No data"
            }
        }

# Test function
async def test_data_collection():
    """Test the data collection system"""
    print("📊 Testing Historical Data Collection...")
    print("=" * 50)
    
    async with HistoricalDataCollector() as collector:
        # Get current data summary
        summary = collector.get_data_summary()
        print(f"Current data summary: {summary}")
        
        # Collect sample data
        print("\n1. Collecting sample market data...")
        market_data = await collector.collect_historical_coingecko_data(days=7)
        print(f"   Collected {len(market_data)} market data points")
        
        print("\n2. Collecting sample network data...")
        network_data = await collector.collect_avalanche_historical_network_data(days=7)
        print(f"   Generated {len(network_data)} network data points")
        
        # Store data
        print("\n3. Storing data...")
        collector.store_market_data(market_data)
        collector.store_network_data(network_data)
        
        # Get training dataset
        print("\n4. Preparing training dataset...")
        df = collector.get_training_dataset(days=7)
        if not df.empty:
            df = collector.add_optimal_fee_labels(df)
            print(f"   Training dataset: {len(df)} samples, {len(df.columns)} features")
            print(f"   Columns: {list(df.columns)}")
        else:
            print("   No training data available")

if __name__ == "__main__":
    asyncio.run(test_data_collection())