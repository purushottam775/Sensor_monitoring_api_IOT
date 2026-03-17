from pymongo import MongoClient
from pymongo.errors import PyMongoError
import pandas as pd
from config import MONGO_URI, DB_NAME, COLLECTION_NAME


def get_collection():
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")

        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        return collection

    except PyMongoError as e:
        raise ConnectionError(f"MongoDB connection failed: {str(e)}")


def fetch_sensor_data(limit=None):

    try:
        collection = get_collection()

        projection = {
            "_id": 0,
            "temperature": 1,
            "humidity": 1,
            "airQuality": 1,
            "rainfall": 1,
            "ldr": 1,
            "timestamp": 1
        }

        cursor = collection.find({}, projection)

        if limit:
            cursor = cursor.limit(limit)

        data = list(cursor)

        if not data:
            raise ValueError("No sensor data found in MongoDB")

        df = pd.DataFrame(data)

        return df

    except Exception as e:
        raise RuntimeError(f"Failed to fetch sensor data: {str(e)}")