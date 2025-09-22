#!/usr/bin/env python3
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config
from data_pipeline import OracleDataPipeline

async def test_enhanced_features():
    """Test the enhanced CoinGecko integration features"""
    print("🚀 Testing Enhanced CoinGecko Integration Features")
    print("=" * 60)
    
    async with OracleDataPipeline() as pipeline:
        
        # Test 1: Enhanced single coin data
        print("\n1. 📊 Enhanced AVAX Data")
        print("-" * 30)
        try:
            avax_data = await pipeline.fetch_coingecko_data("avalanche-2")
            if avax_data:
                print(f"✅ Price: ${avax_data.get('price_usd', 0):.4f}")
                print(f"✅ 1h Change: {avax_data.get('price_change_1h', 0):.2f}%")
                print(f"✅ 24h Change: {avax_data.get('price_change_24h', 0):.2f}%")
                print(f"✅ 7d Change: {avax_data.get('price_change_7d', 0):.2f}%")
                print(f"✅ Market Cap: ${avax_data.get('market_cap', 0):,.0f}")
                print(f"✅ Market Rank: #{avax_data.get('market_cap_rank', 0)}")
                print(f"✅ ATH: ${avax_data.get('ath', 0):.2f}")
                print(f"✅ ATH Distance: {avax_data.get('ath_change_percentage', 0):.1f}%")
                print(f"✅ 24h High: ${avax_data.get('high_24h', 0):.4f}")
                print(f"✅ 24h Low: ${avax_data.get('low_24h', 0):.4f}")
                print(f"✅ Volatility: {avax_data.get('volatility', 0):.2f}%")
                print(f"✅ Volume/Market Cap: {avax_data.get('volume_to_market_cap', 0):.2f}%")
            else:
                print("❌ Failed to fetch enhanced AVAX data")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 2: Global market data
        print("\n2. 🌍 Global Market Data")
        print("-" * 30)
        try:
            global_data = await pipeline.fetch_coingecko_global_data()
            if global_data:
                total_cap = global_data.get('total_market_cap_usd', 0)
                total_vol = global_data.get('total_volume_24h_usd', 0)
                market_change = global_data.get('market_cap_change_24h', 0)
                btc_dom = global_data.get('market_cap_percentage', {}).get('btc', 0)
                eth_dom = global_data.get('market_cap_percentage', {}).get('eth', 0)
                sentiment = global_data.get('market_sentiment', 'unknown')
                
                print(f"✅ Total Market Cap: ${total_cap:,.0f}")
                print(f"✅ 24h Volume: ${total_vol:,.0f}")
                print(f"✅ Market Change 24h: {market_change:.2f}%")
                print(f"✅ BTC Dominance: {btc_dom:.1f}%")
                print(f"✅ ETH Dominance: {eth_dom:.1f}%")
                print(f"✅ Market Sentiment: {sentiment}")
                print(f"✅ Active Cryptocurrencies: {global_data.get('active_cryptocurrencies', 0):,}")
            else:
                print("❌ Failed to fetch global market data")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 3: Multi-coin analysis
        print("\n3. 🔗 Multi-Coin Analysis")
        print("-" * 30)
        try:
            coins = ["avalanche-2", "bitcoin", "ethereum"]
            multi_data = await pipeline.fetch_coingecko_multi_coins(coins)
            if multi_data:
                print(f"✅ Fetched data for {len(multi_data)} coins:")
                for coin_id, coin_data in multi_data.items():
                    symbol = coin_data.get('symbol', 'UNK')
                    price = coin_data.get('price_usd', 0)
                    change = coin_data.get('price_change_24h', 0)
                    volume = coin_data.get('volume_24h', 0)
                    rank = coin_data.get('market_cap_rank', 0)
                    print(f"   {symbol}: ${price:.4f} ({change:+.2f}%) Vol: ${volume:,.0f} Rank: #{rank}")
            else:
                print("❌ Failed to fetch multi-coin data")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 4: Comprehensive market data
        print("\n4. 🎯 Comprehensive Market Analysis")
        print("-" * 30)
        try:
            comprehensive = await pipeline.get_comprehensive_market_data()
            if comprehensive:
                components = []
                if comprehensive.get('coingecko'):
                    components.append("CoinGecko ✅")
                if comprehensive.get('coingecko_global'):
                    components.append("Global ✅")
                if comprehensive.get('multi_coins'):
                    components.append("Multi-Coin ✅")
                if comprehensive.get('pyth'):
                    components.append("Pyth ✅")
                if comprehensive.get('network'):
                    components.append("Network ✅")
                
                print(f"✅ Data Sources: {', '.join(components)}")
                
                market_regime = comprehensive.get('market_regime', 'unknown')
                print(f"✅ Market Regime: {market_regime}")
                
                if comprehensive.get('market_indicators'):
                    indicators = comprehensive['market_indicators']
                    print(f"✅ Volatility Category: {indicators.get('volatility_category', 'unknown')}")
                    print(f"✅ Market Health: {indicators.get('market_health', 'unknown')}")
                    print(f"✅ Global Sentiment: {indicators.get('global_sentiment', 'unknown')}")
                    print(f"✅ Confidence Score: {indicators.get('confidence_score', 0):.2f}")
                
                if comprehensive.get('cross_asset_analysis'):
                    cross_analysis = comprehensive['cross_asset_analysis']
                    leadership = cross_analysis.get('market_leadership', 'unknown')
                    correlations = cross_analysis.get('correlations', {})
                    print(f"✅ Market Leadership: {leadership}")
                    print(f"✅ Cross-Asset Correlations: {len(correlations)} pairs analyzed")
            else:
                print("❌ Failed to fetch comprehensive data")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Enhanced CoinGecko Integration Test Complete!")

if __name__ == "__main__":
    asyncio.run(test_enhanced_features())