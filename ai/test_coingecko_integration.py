#!/usr/bin/env python3
"""
Test script for enhanced CoinGecko integration in Aura AI DEX
Demonstrates the new features and capabilities
"""

import asyncio
import json
from datetime import datetime
from data_pipeline import (
    get_live_market_data,
    get_enhanced_coingecko_data, 
    get_multi_coin_data,
    get_global_market_data,
    get_market_sentiment,
    get_cross_asset_analysis
)

async def test_enhanced_coingecko_integration():
    """Test all enhanced CoinGecko features"""
    print("🚀 Testing Enhanced CoinGecko Integration for Aura AI DEX")
    print("=" * 80)
    
    # Test 1: Enhanced single coin data
    print("\n1. 📊 Testing Enhanced AVAX Data")
    print("-" * 40)
    try:
        avax_data = await get_enhanced_coingecko_data("avalanche-2")
        if avax_data:
            print(f"✅ Price: ${avax_data.get('price_usd', 0):.4f}")
            print(f"✅ 24h Change: {avax_data.get('price_change_24h', 0):.2f}%")
            print(f"✅ Volatility: {avax_data.get('volatility', 0):.2f}%")
            print(f"✅ RSI (14): {avax_data.get('rsi_14', 50):.1f}")
            print(f"✅ Volume/Market Cap: {avax_data.get('volume_to_market_cap', 0):.2f}%")
            print(f"✅ Volatility Class: {avax_data.get('volatility_class', 'unknown')}")
            print(f"✅ Volume Class: {avax_data.get('volume_class', 'unknown')}")
            print(f"✅ Price Position (24h): {avax_data.get('price_position_24h', 50):.1f}%")
        else:
            print("❌ Failed to fetch enhanced AVAX data")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Multi-coin analysis
    print("\n2. 🌐 Testing Multi-Coin Analysis")
    print("-" * 40)
    try:
        coins = ["avalanche-2", "bitcoin", "ethereum", "solana"]
        multi_data = await get_multi_coin_data(coins)
        if multi_data:
            print(f"✅ Fetched data for {len(multi_data)} coins:")
            for coin_id, coin_data in multi_data.items():
                symbol = coin_data.get('symbol', 'UNK')
                price = coin_data.get('price_usd', 0)
                change = coin_data.get('price_change_24h', 0)
                print(f"   {symbol}: ${price:.4f} ({change:+.2f}%)")
        else:
            print("❌ Failed to fetch multi-coin data")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Global market data
    print("\n3. 🌍 Testing Global Market Data")
    print("-" * 40)
    try:
        global_data = await get_global_market_data()
        if global_data:
            total_cap = global_data.get('total_market_cap_usd', 0)
            total_vol = global_data.get('total_volume_24h_usd', 0)
            btc_dom = global_data.get('market_cap_percentage', {}).get('btc', 0)
            sentiment = global_data.get('market_sentiment', 'unknown')
            
            print(f"✅ Total Market Cap: ${total_cap:,.0f}")
            print(f"✅ 24h Volume: ${total_vol:,.0f}")
            print(f"✅ BTC Dominance: {btc_dom:.1f}%")
            print(f"✅ Market Sentiment: {sentiment}")
        else:
            print("❌ Failed to fetch global market data")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Cross-asset analysis
    print("\n4. 🔗 Testing Cross-Asset Analysis")
    print("-" * 40)
    try:
        cross_analysis = await get_cross_asset_analysis()
        if cross_analysis:
            leadership = cross_analysis.get('market_leadership', 'unknown')
            correlations = cross_analysis.get('correlations', {})
            
            print(f"✅ Market Leadership: {leadership}")
            print(f"✅ Correlations found: {len(correlations)}")
            
            for pair, corr_data in list(correlations.items())[:3]:  # Show first 3
                correlation = corr_data.get('correlation', 'neutral')
                print(f"   {pair.replace('_', ' vs ')}: {correlation}")
        else:
            print("❌ Failed to fetch cross-asset analysis")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 5: Market sentiment
    print("\n5. 😊 Testing Market Sentiment")
    print("-" * 40)
    try:
        sentiment = await get_market_sentiment()
        print(f"✅ Overall Market Sentiment: {sentiment}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 6: Comprehensive market data
    print("\n6. 🎯 Testing Comprehensive Market Data")
    print("-" * 40)
    try:
        comprehensive_data = await get_live_market_data()
        if comprehensive_data:
            components = []
            if comprehensive_data.get('coingecko'):
                components.append("CoinGecko ✅")
            if comprehensive_data.get('coingecko_global'):
                components.append("Global Data ✅")
            if comprehensive_data.get('multi_coins'):
                components.append("Multi-Coin ✅")
            if comprehensive_data.get('pyth'):
                components.append("Pyth ✅")
            if comprehensive_data.get('network'):
                components.append("Network ✅")
            if comprehensive_data.get('market_indicators'):
                components.append("Indicators ✅")
            if comprehensive_data.get('cross_asset_analysis'):
                components.append("Cross-Asset ✅")
            
            print(f"✅ Data Sources: {', '.join(components)}")
            
            market_regime = comprehensive_data.get('market_regime', 'unknown')
            print(f"✅ Market Regime: {market_regime}")
            
            if comprehensive_data.get('market_indicators'):
                indicators = comprehensive_data['market_indicators']
                print(f"✅ Volatility Category: {indicators.get('volatility_category', 'unknown')}")
                print(f"✅ Liquidity Tier: {indicators.get('liquidity_tier', 'unknown')}")
                print(f"✅ Trend Direction: {indicators.get('trend_direction', 'unknown')}")
                print(f"✅ Confidence Score: {indicators.get('confidence_score', 0):.2f}")
        else:
            print("❌ Failed to fetch comprehensive market data")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 80)
    print("🎉 Enhanced CoinGecko Integration Test Complete!")
    print(f"⏰ Test completed at: {datetime.now().isoformat()}")

# Test specific features
async def test_technical_indicators():
    """Test technical analysis features"""
    print("\n📈 Testing Technical Analysis Features")
    print("-" * 50)
    
    try:
        avax_data = await get_enhanced_coingecko_data("avalanche-2")
        if avax_data:
            print("Technical Indicators for AVAX:")
            print(f"  RSI (14): {avax_data.get('rsi_14', 50):.1f}")
            print(f"  Price Volatility (7d): {avax_data.get('price_volatility_7d', 0):.2f}%")
            print(f"  ATH Distance: {avax_data.get('ath_change_percentage', 0):.1f}%")
            print(f"  24h High: ${avax_data.get('high_24h', 0):.4f}")
            print(f"  24h Low: ${avax_data.get('low_24h', 0):.4f}")
            print(f"  Market Cap Rank: #{avax_data.get('market_cap_rank', 0)}")
            
            # Derived metrics
            print("\nDerived Metrics:")
            print(f"  Volatility Class: {avax_data.get('volatility_class', 'unknown')}")
            print(f"  Volume Class: {avax_data.get('volume_class', 'unknown')}")
            print(f"  Price Position: {avax_data.get('price_position_24h', 50):.1f}%")
        
    except Exception as e:
        print(f"Error testing technical indicators: {e}")

if __name__ == "__main__":
    # Run the comprehensive test
    asyncio.run(test_enhanced_coingecko_integration())
    
    # Run technical indicators test
    asyncio.run(test_technical_indicators())