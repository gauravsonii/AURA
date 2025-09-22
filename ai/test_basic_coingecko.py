#!/usr/bin/env python3
import asyncio
import os
import aiohttp
from dotenv import load_dotenv

load_dotenv()

async def test_coingecko_basic():
    """Test basic CoinGecko API connection"""
    print("🔍 Testing CoinGecko API Key...")
    
    api_key = os.getenv('COINGECKO_API_KEY')
    if api_key and api_key != 'your_coingecko_api_key_here':
        print("✅ API Key found in environment")
        print(f"Key starts with: {api_key[:8]}...")
    else:
        print("⚠️  Using demo mode (no API key)")

    try:
        async with aiohttp.ClientSession() as session:
            url = 'https://api.coingecko.com/api/v3/coins/avalanche-2'
            params = {'localization': 'false', 'market_data': 'true'}
            
            headers = {}
            if api_key and api_key != 'your_coingecko_api_key_here':
                headers['x-cg-demo-api-key'] = api_key
                
            async with session.get(url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    price = data['market_data']['current_price']['usd']
                    change_24h = data['market_data']['price_change_percentage_24h']
                    volume = data['market_data']['total_volume']['usd']
                    
                    print('✅ CoinGecko API Response:')
                    print(f'   AVAX Price: ${price:.4f}')
                    print(f'   24h Change: {change_24h:.2f}%')
                    print(f'   24h Volume: ${volume:,.0f}')
                    print()
                    print('🎉 CoinGecko integration is working perfectly!')
                    print('Ready to test enhanced features...')
                    return True
                else:
                    print(f'❌ API Error: Status {response.status}')
                    if response.status == 429:
                        print('   Rate limit exceeded - try again in a moment')
                    return False
    except Exception as e:
        print(f'❌ Connection Error: {e}')
        return False

if __name__ == "__main__":
    asyncio.run(test_coingecko_basic())