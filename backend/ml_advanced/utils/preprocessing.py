import pandas as pd
import numpy as np

def clean_data(df):
    """Basic data cleaning and type conversion."""
    if df.empty:
        return df
        
    # Drop rows with all NaN
    df = df.dropna(how='all')
    
    # Ensure numeric columns
    numeric_cols = ["temperature", "humidity", "airQuality", "rainfall", "ldr"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            
    # Fill missing values with median
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    
    return df

def feature_engineering(df):
    """Apply advanced feature engineering: Cyclic time and Lagged features."""
    if df.empty:
        return df
        
    df = df.copy()
    
    # Cyclic Time Encoding (Hour and Minute)
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['timestamp'].dt.hour
        df['minute'] = df['timestamp'].dt.minute
        
        # Encode sine and cosine
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['min_sin'] = np.sin(2 * np.pi * df['minute'] / 60)
        df['min_cos'] = np.cos(2 * np.pi * df['minute'] / 60)
        
    # Lagged Features (t-1)
    # Note: We only do this for the core sensor values
    sensor_cols = ["temperature", "humidity", "airQuality", "rainfall", "ldr"]
    for col in sensor_cols:
        if col in df.columns:
            df[f'{col}_lag1'] = df[col].shift(1)
            
    # Fill first row (which has NaN lags) with the current values
    lag_cols = [f'{col}_lag1' for col in sensor_cols]
    df[lag_cols] = df[lag_cols].bfill()
    
    return df
