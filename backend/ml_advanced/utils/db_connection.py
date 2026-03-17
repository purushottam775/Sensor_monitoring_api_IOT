import os
import sys
from pymongo import MongoClient
from config import MONGO_URI, DB_NAME, COLLECTION_NAME
import pandas as pd

def fetch_sensor_data():
    """Fetch all sensor data from MongoDB and return as a DataFrame."""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        
        # Sort by timestamp to ensure chronological order
        cursor = collection.find().sort("timestamp", 1)
        data = list(cursor)
        
        if not data:
            return pd.DataFrame()
            
        df = pd.DataFrame(data)
        
        # Remove MongoDB internal ID
        if '_id' in df.columns:
            df.drop(columns=['_id'], inplace=True)
            
        return df
    except Exception as e:
        print(f"Error fetching data from MongoDB: {e}")
        return pd.DataFrame()
