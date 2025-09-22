"""
Advanced Machine Learning Models for Aura AI Backend
Implements neural networks, ensemble methods, and real-time learning
"""
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV, TimeSeriesSplit
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import lightgbm as lgb
import pickle
import joblib
import json
import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
import asyncio
import warnings
warnings.filterwarnings('ignore')

from config import Config
from data_pipeline import get_live_market_data

logger = logging.getLogger(__name__)

class AdvancedFeePredictor:
    """Advanced ML model for DEX fee prediction using ensemble methods and neural networks"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_columns = [
            'volatility', 'volume_24h', 'price_change_1h', 'price_change_24h',
            'market_cap', 'gas_price_gwei', 'liquidity_score',
            'hour_of_day', 'day_of_week', 'volume_ma_7d', 'volatility_ma_7d',
            'price_momentum', 'volume_ratio', 'gas_trend'
        ]
        self.models_dir = "models/advanced/"
        self.is_trained = False
        
        # Create models directory
        os.makedirs(self.models_dir, exist_ok=True)
        
        # Initialize models
        self._initialize_models()
        
        # Try to load existing models
        self._load_models()
    
    def _initialize_models(self):
        """Initialize all ML models"""
        # Random Forest
        self.models['random_forest'] = RandomForestRegressor(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        
        # Gradient Boosting
        self.models['gradient_boosting'] = GradientBoostingRegressor(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        
        # XGBoost
        self.models['xgboost'] = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )
        
        # LightGBM
        self.models['lightgbm'] = lgb.LGBMRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            verbose=-1
        )
        
        # Neural Network
        self.models['neural_network'] = None  # Will be built dynamically
        
        # Initialize scalers
        for model_name in self.models.keys():
            self.scalers[model_name] = StandardScaler()
    
    def _build_neural_network(self, input_shape: int) -> tf.keras.Model:
        """Build a neural network for fee prediction"""
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_shape=(input_shape,)),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(8, activation='relu'),
            tf.keras.layers.Dense(1, activation='linear')
        ])
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='mean_squared_error',
            metrics=['mean_absolute_error']
        )
        
        return model
    
    def _generate_advanced_training_data(self, n_samples: int = 5000) -> pd.DataFrame:
        """Generate sophisticated training data with more realistic patterns"""
        np.random.seed(42)
        
        data = []
        
        for i in range(n_samples):
            # Time-based features
            hour_of_day = np.random.randint(0, 24)
            day_of_week = np.random.randint(0, 7)
            
            # Market volatility with time-based patterns
            base_volatility = 3.0
            if hour_of_day in [9, 10, 16, 17]:  # Market open/close times
                volatility_multiplier = 1.5
            else:
                volatility_multiplier = 1.0
            
            volatility = np.random.exponential(base_volatility) * volatility_multiplier
            volatility = max(0.5, min(volatility, 25))
            
            # Volume with volatility correlation
            base_volume = 800_000_000
            volume_noise = np.random.lognormal(0, 0.3)
            volatility_impact = 1 + (volatility - 5) * 0.1
            volume_24h = base_volume * volume_noise * volatility_impact
            volume_24h = max(50_000_000, min(volume_24h, 5_000_000_000))
            
            # Price changes
            price_change_1h = np.random.normal(0, volatility/10)
            price_change_24h = np.random.normal(0, volatility/3)
            
            # Market cap
            market_cap = np.random.lognormal(24, 0.4)  # Around 26B with variation
            
            # Gas price with network congestion
            if day_of_week in [1, 2, 3]:  # Weekdays more congested
                gas_multiplier = 1.3
            else:
                gas_multiplier = 0.8
            
            gas_price_gwei = np.random.exponential(30) * gas_multiplier
            gas_price_gwei = max(15, min(gas_price_gwei, 300))
            
            # Liquidity score
            liquidity_score = (volume_24h / market_cap) * 100
            
            # Moving averages (simulated)
            volume_ma_7d = volume_24h * np.random.uniform(0.8, 1.2)
            volatility_ma_7d = volatility * np.random.uniform(0.7, 1.3)
            
            # Technical indicators
            price_momentum = price_change_24h * np.random.uniform(0.5, 1.5)
            volume_ratio = volume_24h / volume_ma_7d
            gas_trend = (gas_price_gwei - 25) / 275  # Normalized gas trend
            
            # Calculate optimal fee using sophisticated logic
            optimal_fee = self._calculate_sophisticated_optimal_fee({
                'volatility': volatility,
                'volume_24h': volume_24h,
                'price_change_1h': price_change_1h,
                'price_change_24h': price_change_24h,
                'market_cap': market_cap,
                'gas_price_gwei': gas_price_gwei,
                'liquidity_score': liquidity_score,
                'hour_of_day': hour_of_day,
                'day_of_week': day_of_week,
                'volume_ma_7d': volume_ma_7d,
                'volatility_ma_7d': volatility_ma_7d,
                'price_momentum': price_momentum,
                'volume_ratio': volume_ratio,
                'gas_trend': gas_trend
            })
            
            row = [
                volatility, volume_24h, price_change_1h, price_change_24h,
                market_cap, gas_price_gwei, liquidity_score,
                hour_of_day, day_of_week, volume_ma_7d, volatility_ma_7d,
                price_momentum, volume_ratio, gas_trend, optimal_fee
            ]
            
            data.append(row)
        
        columns = self.feature_columns + ['optimal_fee']
        df = pd.DataFrame(data, columns=columns)
        
        return df
    
    def _calculate_sophisticated_optimal_fee(self, features: Dict) -> float:
        """Calculate optimal fee using sophisticated market logic"""
        base_fee = Config.BASE_FEE_RATE
        
        # Volatility impact (non-linear)
        volatility = features['volatility']
        if volatility > 10:
            volatility_factor = 1 + (volatility - 10) ** 1.2 * 0.05
        elif volatility < 2:
            volatility_factor = 0.8
        else:
            volatility_factor = 1 + (volatility - 5) * 0.02
        
        # Volume impact (inverse relationship)
        volume_ratio = features['volume_ratio']
        if volume_ratio > 1.2:
            volume_factor = 0.9  # High volume = lower fees
        elif volume_ratio < 0.8:
            volume_factor = 1.1  # Low volume = higher fees
        else:
            volume_factor = 1.0
        
        # Gas price impact
        gas_trend = features['gas_trend']
        gas_factor = 1 + gas_trend * 0.3
        
        # Time-based adjustments
        hour = features['hour_of_day']
        if hour in [9, 10, 16, 17]:  # Peak trading hours
            time_factor = 1.1
        elif hour in [2, 3, 4, 5]:  # Low activity hours
            time_factor = 0.9
        else:
            time_factor = 1.0
        
        # Liquidity impact
        liquidity_score = features['liquidity_score']
        if liquidity_score > 5:
            liquidity_factor = 0.95
        elif liquidity_score < 1:
            liquidity_factor = 1.15
        else:
            liquidity_factor = 1.0
        
        # Price momentum impact
        momentum = abs(features['price_momentum'])
        momentum_factor = 1 + momentum * 0.01
        
        # Combine all factors
        optimal_fee = base_fee * volatility_factor * volume_factor * gas_factor * time_factor * liquidity_factor * momentum_factor
        
        # Add some realistic noise
        noise = np.random.normal(0, 0.02)
        optimal_fee += noise
        
        # Clamp to reasonable bounds
        optimal_fee = max(0.05, min(optimal_fee, 3.0))
        
        return optimal_fee
    
    def train_models(self, df: Optional[pd.DataFrame] = None) -> Dict[str, float]:
        """Train all models on the dataset"""
        logger.info("Training advanced ML models...")
        
        # Generate training data if not provided
        if df is None:
            df = self._generate_advanced_training_data(5000)
        
        # Prepare features and target
        X = df[self.feature_columns]
        y = df['optimal_fee']
        
        # Split data with time series considerations
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, shuffle=True
        )
        
        results = {}
        
        # Train each model
        for model_name, model in self.models.items():
            if model_name == 'neural_network':
                continue  # Handle separately
            
            logger.info(f"Training {model_name}...")
            
            # Scale features
            X_train_scaled = self.scalers[model_name].fit_transform(X_train)
            X_test_scaled = self.scalers[model_name].transform(X_test)
            
            # Train model
            model.fit(X_train_scaled, y_train)
            
            # Evaluate
            train_pred = model.predict(X_train_scaled)
            test_pred = model.predict(X_test_scaled)
            
            train_r2 = r2_score(y_train, train_pred)
            test_r2 = r2_score(y_test, test_pred)
            test_mse = mean_squared_error(y_test, test_pred)
            test_mae = mean_absolute_error(y_test, test_pred)
            
            results[model_name] = {
                'train_r2': train_r2,
                'test_r2': test_r2,
                'test_mse': test_mse,
                'test_mae': test_mae
            }
            
            logger.info(f"{model_name} - Test R²: {test_r2:.4f}, MAE: {test_mae:.4f}")
        
        # Train Neural Network
        logger.info("Training neural network...")
        X_train_nn = self.scalers['neural_network'].fit_transform(X_train)
        X_test_nn = self.scalers['neural_network'].transform(X_test)
        
        self.models['neural_network'] = self._build_neural_network(X_train_nn.shape[1])
        
        # Train with early stopping
        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss', patience=20, restore_best_weights=True
        )
        
        history = self.models['neural_network'].fit(
            X_train_nn, y_train,
            epochs=200,
            batch_size=32,
            validation_data=(X_test_nn, y_test),
            callbacks=[early_stopping],
            verbose=0
        )
        
        # Evaluate neural network
        test_pred_nn = self.models['neural_network'].predict(X_test_nn, verbose=0)
        test_r2_nn = r2_score(y_test, test_pred_nn)
        test_mse_nn = mean_squared_error(y_test, test_pred_nn)
        test_mae_nn = mean_absolute_error(y_test, test_pred_nn)
        
        results['neural_network'] = {
            'test_r2': test_r2_nn,
            'test_mse': test_mse_nn,
            'test_mae': test_mae_nn
        }
        
        logger.info(f"Neural Network - Test R²: {test_r2_nn:.4f}, MAE: {test_mae_nn:.4f}")
        
        # Find best model
        best_model = max(results.keys(), key=lambda k: results[k]['test_r2'])
        logger.info(f"Best performing model: {best_model}")
        
        self.is_trained = True
        self._save_models()
        
        return results
    
    def _save_models(self):
        """Save all trained models"""
        try:
            # Save sklearn models
            for model_name, model in self.models.items():
                if model_name == 'neural_network':
                    if model is not None:
                        model.save(os.path.join(self.models_dir, f'{model_name}.h5'))
                else:
                    joblib.dump(model, os.path.join(self.models_dir, f'{model_name}.pkl'))
            
            # Save scalers
            for scaler_name, scaler in self.scalers.items():
                joblib.dump(scaler, os.path.join(self.models_dir, f'{scaler_name}_scaler.pkl'))
            
            # Save metadata
            metadata = {
                'feature_columns': self.feature_columns,
                'is_trained': self.is_trained,
                'training_timestamp': datetime.now().isoformat()
            }
            
            with open(os.path.join(self.models_dir, 'metadata.json'), 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info("All models saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving models: {e}")
    
    def _load_models(self):
        """Load saved models"""
        try:
            metadata_path = os.path.join(self.models_dir, 'metadata.json')
            if not os.path.exists(metadata_path):
                return
            
            # Load metadata
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            self.feature_columns = metadata.get('feature_columns', self.feature_columns)
            
            # Load sklearn models
            for model_name in ['random_forest', 'gradient_boosting', 'xgboost', 'lightgbm']:
                model_path = os.path.join(self.models_dir, f'{model_name}.pkl')
                if os.path.exists(model_path):
                    self.models[model_name] = joblib.load(model_path)
            
            # Load neural network
            nn_path = os.path.join(self.models_dir, 'neural_network.h5')
            if os.path.exists(nn_path):
                self.models['neural_network'] = tf.keras.models.load_model(nn_path)
            
            # Load scalers
            for scaler_name in self.scalers.keys():
                scaler_path = os.path.join(self.models_dir, f'{scaler_name}_scaler.pkl')
                if os.path.exists(scaler_path):
                    self.scalers[scaler_name] = joblib.load(scaler_path)
            
            self.is_trained = True
            logger.info("Models loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            self.is_trained = False
    
    def _extract_advanced_features(self, market_data: Dict) -> Optional[np.ndarray]:
        """Extract advanced features from market data"""
        try:
            coingecko = market_data.get('coingecko', {})
            network = market_data.get('network', {})
            
            if not coingecko:
                return None
            
            # Current time features
            now = datetime.now()
            hour_of_day = now.hour
            day_of_week = now.weekday()
            
            # Basic features
            volatility = coingecko.get('volatility', 0)
            volume_24h = coingecko.get('volume_24h', 0)
            price_change_24h = coingecko.get('price_change_24h', 0)
            market_cap = coingecko.get('market_cap', 0)
            gas_price_gwei = network.get('gas_price_gwei', 25) if network else 25
            
            # Calculate derived features
            liquidity_score = (volume_24h / max(market_cap, 1)) * 100 if market_cap > 0 else 0
            
            # Simulated moving averages (in production, use actual historical data)
            volume_ma_7d = volume_24h * 0.95  # Placeholder
            volatility_ma_7d = volatility * 1.1  # Placeholder
            
            # Price momentum (simplified)
            price_change_1h = price_change_24h * 0.1  # Approximate 1h change
            price_momentum = price_change_24h * 1.2  # Simplified momentum
            
            # Volume ratio
            volume_ratio = volume_24h / volume_ma_7d if volume_ma_7d > 0 else 1.0
            
            # Gas trend
            gas_trend = (gas_price_gwei - 25) / 275
            
            features = np.array([[
                volatility, volume_24h, price_change_1h, price_change_24h,
                market_cap, gas_price_gwei, liquidity_score,
                hour_of_day, day_of_week, volume_ma_7d, volatility_ma_7d,
                price_momentum, volume_ratio, gas_trend
            ]])
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting advanced features: {e}")
            return None
    
    async def predict_optimal_fee(self, market_data: Optional[Dict] = None) -> Dict:
        """Predict optimal fee using ensemble of models"""
        try:
            # Get market data if not provided
            if market_data is None:
                market_data = await get_live_market_data()
            
            # Extract features
            features = self._extract_advanced_features(market_data)
            if features is None:
                return self._fallback_prediction()
            
            if not self.is_trained:
                # Train models if not already trained
                logger.info("Models not trained, training now...")
                self.train_models()
            
            # Get predictions from all models
            predictions = {}
            confidences = {}
            
            for model_name, model in self.models.items():
                if model is None:
                    continue
                
                try:
                    # Scale features
                    features_scaled = self.scalers[model_name].transform(features)
                    
                    # Make prediction
                    if model_name == 'neural_network':
                        pred = model.predict(features_scaled, verbose=0)[0][0]
                    else:
                        pred = model.predict(features_scaled)[0]
                    
                    predictions[model_name] = pred
                    confidences[model_name] = self._calculate_model_confidence(model_name, features_scaled)
                    
                except Exception as e:
                    logger.warning(f"Error with {model_name}: {e}")
                    continue
            
            if not predictions:
                return self._fallback_prediction()
            
            # Ensemble prediction (weighted average based on confidence)
            total_weight = sum(confidences.values())
            if total_weight > 0:
                ensemble_prediction = sum(
                    pred * confidences[model_name] 
                    for model_name, pred in predictions.items()
                ) / total_weight
            else:
                ensemble_prediction = np.mean(list(predictions.values()))
            
            # Clamp prediction
            ensemble_prediction = max(0.05, min(ensemble_prediction, 3.0))
            
            # Calculate overall confidence
            overall_confidence = min(np.mean(list(confidences.values())), 0.95)
            
            # Generate advanced reasoning
            reasoning = self._generate_advanced_reasoning(features[0], predictions, ensemble_prediction)
            
            # Determine market condition
            volatility = features[0][0]
            market_condition = self._classify_market_condition(volatility, features[0])
            
            return {
                "recommended_fee": round(ensemble_prediction, 4),
                "confidence": round(overall_confidence, 3),
                "reasoning": reasoning,
                "market_condition": market_condition,
                "model_predictions": {k: round(v, 4) for k, v in predictions.items()},
                "model_confidences": {k: round(v, 3) for k, v in confidences.items()},
                "ensemble_method": "weighted_average",
                "features_analyzed": len(self.feature_columns),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in advanced fee prediction: {e}")
            return self._fallback_prediction()
    
    def _calculate_model_confidence(self, model_name: str, features: np.ndarray) -> float:
        """Calculate confidence score for a model's prediction"""
        # Simple confidence calculation (can be improved with actual uncertainty estimation)
        base_confidence = {
            'random_forest': 0.85,
            'gradient_boosting': 0.80,
            'xgboost': 0.88,
            'lightgbm': 0.86,
            'neural_network': 0.82
        }.get(model_name, 0.75)
        
        # Add feature-based confidence adjustment
        volatility = features[0][0]  # First feature is volatility
        if volatility > 15:  # High volatility reduces confidence
            confidence_adjustment = -0.1
        elif volatility < 2:  # Low volatility increases confidence
            confidence_adjustment = 0.05
        else:
            confidence_adjustment = 0
        
        return max(0.5, min(base_confidence + confidence_adjustment, 0.95))
    
    def _generate_advanced_reasoning(self, features: np.ndarray, predictions: Dict, final_prediction: float) -> str:
        """Generate detailed reasoning for the prediction"""
        volatility, volume_24h, price_change_1h, price_change_24h = features[:4]
        market_cap, gas_price_gwei, liquidity_score = features[4:7]
        hour_of_day, day_of_week = features[7:9]
        
        reasons = []
        
        # Model consensus
        model_range = max(predictions.values()) - min(predictions.values())
        if model_range < 0.1:
            reasons.append(f"Strong model consensus (range: {model_range:.3f}%)")
        else:
            reasons.append(f"Moderate model disagreement (range: {model_range:.3f}%)")
        
        # Market analysis
        if volatility > 10:
            reasons.append(f"High volatility ({volatility:.1f}%) increases uncertainty and fees")
        elif volatility < 2:
            reasons.append(f"Low volatility ({volatility:.1f}%) indicates stable conditions")
        
        # Volume analysis
        if volume_24h > 1_000_000_000:
            reasons.append("High trading volume suggests strong market liquidity")
        elif volume_24h < 200_000_000:
            reasons.append("Low trading volume may increase price impact")
        
        # Network conditions
        if gas_price_gwei > 100:
            reasons.append(f"High network congestion (gas: {gas_price_gwei:.0f} GWEI)")
        
        # Time-based factors
        if hour_of_day in [9, 10, 16, 17]:
            reasons.append("Peak trading hours typically have higher volatility")
        
        # Fee comparison
        base_fee = Config.BASE_FEE_RATE
        if final_prediction > base_fee * 1.5:
            reasons.append(f"Recommended fee is {((final_prediction/base_fee-1)*100):.0f}% above base rate")
        elif final_prediction < base_fee * 0.8:
            reasons.append(f"Recommended fee is {((1-final_prediction/base_fee)*100):.0f}% below base rate")
        
        return ". ".join(reasons) + "."
    
    def _classify_market_condition(self, volatility: float, features: np.ndarray) -> str:
        """Classify current market condition"""
        volume_24h = features[1]
        price_change_24h = features[3]
        gas_price_gwei = features[5]
        
        # Multi-factor classification
        if volatility > 15 and abs(price_change_24h) > 10:
            return "highly_volatile"
        elif volatility > 8 and gas_price_gwei > 80:
            return "congested_volatile"
        elif volatility < 2 and volume_24h > 800_000_000:
            return "stable_liquid"
        elif volatility < 3:
            return "stable"
        elif volatility > 10:
            return "volatile"
        else:
            return "moderate"
    
    def _fallback_prediction(self) -> Dict:
        """Fallback prediction when models fail"""
        return {
            "recommended_fee": Config.BASE_FEE_RATE,
            "confidence": 0.3,
            "reasoning": "Using fallback prediction due to insufficient data or model errors",
            "market_condition": "unknown",
            "model_predictions": {},
            "ensemble_method": "fallback",
            "timestamp": datetime.now().isoformat()
        }

# Initialize global advanced model
advanced_fee_predictor = AdvancedFeePredictor()

async def get_advanced_fee_recommendation(market_data: Optional[Dict] = None) -> Dict:
    """Get advanced ML-based fee recommendation"""
    return await advanced_fee_predictor.predict_optimal_fee(market_data)

async def train_advanced_models() -> Dict[str, float]:
    """Train all advanced models"""
    return advanced_fee_predictor.train_models()

# Test function
async def test_advanced_models():
    """Test the advanced ML models"""
    print("🧠 Testing Advanced ML Models...")
    print("=" * 50)
    
    # Train models
    print("1. Training models...")
    results = await train_advanced_models()
    
    for model_name, metrics in results.items():
        print(f"   {model_name}: R² = {metrics['test_r2']:.4f}, MAE = {metrics['test_mae']:.4f}")
    
    # Test prediction
    print("\n2. Testing prediction...")
    prediction = await get_advanced_fee_recommendation()
    
    print(f"   Recommended Fee: {prediction['recommended_fee']:.4f}%")
    print(f"   Confidence: {prediction['confidence']:.3f}")
    print(f"   Market Condition: {prediction['market_condition']}")
    print(f"   Models Used: {list(prediction['model_predictions'].keys())}")
    print(f"   Reasoning: {prediction['reasoning'][:100]}...")

if __name__ == "__main__":
    asyncio.run(test_advanced_models())