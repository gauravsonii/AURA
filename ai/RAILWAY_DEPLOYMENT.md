# Railway Deployment Guide for Aura AI Backend

This guide will help you deploy your Aura AI Backend to Railway, a modern cloud platform for deploying applications.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **API Keys**: You'll need API keys for CoinGecko and Snowtrace

## Step 1: Prepare Your Repository

### 1.1 Commit All Files
Make sure all your AI backend files are committed to your repository:

```bash
cd /Users/priyanshutiwari/codes/web3/hackathon/Aura
git add ai/
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 1.2 Verify Required Files
Ensure these files exist in your `ai/` directory:
- `main.py` - Your FastAPI application
- `requirements.txt` - Python dependencies
- `railway.json` - Railway configuration
- `Procfile` - Process definition
- `.env.example` - Environment variables template

## Step 2: Deploy to Railway

### 2.1 Create New Project
1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the `ai` folder as the root directory

### 2.2 Configure Environment Variables
In your Railway project dashboard:

1. Go to the "Variables" tab
2. Add the following environment variables:

```bash
# API Keys (Required)
COINGECKO_API_KEY=your_actual_coingecko_api_key
SNOWTRACE_API_KEY=your_actual_snowtrace_api_key

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False

# Model Configuration
MODEL_RETRAIN_INTERVAL=3600
VOLATILITY_THRESHOLD=3.0
BASE_FEE_RATE=0.3

# Cache Configuration
CACHE_TTL=300

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

### 2.3 Deploy
1. Railway will automatically detect your Python application
2. It will install dependencies from `requirements.txt`
3. The deployment will start automatically
4. Monitor the deployment logs in the Railway dashboard

## Step 3: Verify Deployment

### 3.1 Check Health Endpoint
Once deployed, test your API:

```bash
curl https://your-app-name.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00",
  "version": "1.0.0",
  "services": {
    "ai_models": "healthy",
    "data_pipeline": "healthy",
    "contract_scanner": "healthy"
  }
}
```

### 3.2 Test API Endpoints
```bash
# Test market data
curl https://your-app-name.railway.app/market-data

# Test fee recommendation
curl https://your-app-name.railway.app/recommend-fee

# Test contract scanning
curl https://your-app-name.railway.app/quick-risk/0x1234567890123456789012345678901234567890
```

### 3.3 Access API Documentation
Visit: `https://your-app-name.railway.app/docs`

## Step 4: Configure Custom Domain (Optional)

1. In Railway dashboard, go to "Settings"
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Step 5: Monitor and Maintain

### 5.1 View Logs
- Go to your Railway project dashboard
- Click on your service
- View real-time logs in the "Deployments" tab

### 5.2 Monitor Performance
- Railway provides built-in metrics
- Monitor CPU, memory, and network usage
- Set up alerts for critical issues

### 5.3 Update Your Application
1. Push changes to your GitHub repository
2. Railway will automatically redeploy
3. Monitor the deployment logs

## Troubleshooting

### Common Issues

#### 1. Build Failures
- Check that all dependencies are in `requirements.txt`
- Verify Python version compatibility
- Check build logs for specific errors

#### 2. Runtime Errors
- Verify all environment variables are set
- Check application logs for errors
- Ensure API keys are valid

#### 3. Memory Issues
- Railway provides 512MB by default
- Consider upgrading if you need more memory
- Optimize your ML models if needed

#### 4. API Key Issues
- Verify API keys are correctly set in Railway
- Check if API keys have proper permissions
- Test API keys locally first

### Debug Commands

```bash
# Check if the app is running
curl https://your-app-name.railway.app/health

# Test specific endpoint
curl https://your-app-name.railway.app/config

# Check logs in Railway dashboard
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COINGECKO_API_KEY` | Yes | - | CoinGecko API key for market data |
| `SNOWTRACE_API_KEY` | Yes | - | Snowtrace API key for Avalanche data |
| `API_HOST` | No | `0.0.0.0` | Host to bind the server |
| `API_PORT` | No | `8000` | Port to bind the server |
| `DEBUG` | No | `False` | Enable debug mode |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `VOLATILITY_THRESHOLD` | No | `3.0` | Volatility threshold for recommendations |
| `BASE_FEE_RATE` | No | `0.3` | Base fee rate percentage |

## API Endpoints

Your deployed API will have these endpoints:

- `GET /` - API information
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation
- `GET /market-data` - Current market data
- `GET /recommend-fee` - AI fee recommendation
- `POST /scan-contract` - Contract security scan
- `GET /market-data/enhanced` - Enhanced market data
- `GET /market-data/global` - Global market statistics

## Cost Considerations

- Railway offers a free tier with 500 hours/month
- Paid plans start at $5/month for unlimited usage
- Monitor your usage in the Railway dashboard

## Security Best Practices

1. **Environment Variables**: Never commit API keys to your repository
2. **CORS**: Configure CORS properly for production
3. **Rate Limiting**: Consider implementing rate limiting
4. **HTTPS**: Railway provides HTTPS by default
5. **API Keys**: Rotate API keys regularly

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Your application logs in Railway dashboard

---

## Quick Start Checklist

- [ ] Repository is pushed to GitHub
- [ ] Railway project is created
- [ ] Environment variables are configured
- [ ] Deployment is successful
- [ ] Health endpoint responds
- [ ] API documentation is accessible
- [ ] Custom domain is configured (optional)
- [ ] Monitoring is set up

Your Aura AI Backend should now be successfully deployed on Railway! 🚀
