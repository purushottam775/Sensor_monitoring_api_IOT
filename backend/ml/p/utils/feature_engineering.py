import pandas as pd


def add_time_features(df):

    if "timestamp" not in df.columns:
        return df

    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"])

    df["hour"] = df["timestamp"].dt.hour
    df["day"] = df["timestamp"].dt.day
    df["month"] = df["timestamp"].dt.month
    df["weekday"] = df["timestamp"].dt.dayofweek

    return df