import pandas as pd

REQUIRED_COLUMNS = [
    "temperature",
    "humidity",
    "airQuality",
    "rainfall",
    "ldr"
]


def validate_columns(df):

    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]

    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def clean_data(df):

    if df is None or df.empty:
        raise ValueError("Dataset is empty")

    validate_columns(df)

    df = df.drop_duplicates()

    numeric_cols = [
        "temperature",
        "humidity",
        "airQuality",
        "rainfall",
        "ldr"
    ]

    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=numeric_cols)

    # basic value filtering
    df = df[df["humidity"].between(0, 100)]
    df = df[df["airQuality"] >= 0]
    df = df[df["ldr"] >= 0]

    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        df = df.dropna(subset=["timestamp"])
        df = df.sort_values("timestamp")

    if len(df) < 20:
        raise ValueError("Not enough valid training rows")

    return df


def prepare_features(df):

    X = df[[
        "temperature",
        "humidity",
        "rainfall",
        "ldr"
    ]]

    y = df["airQuality"]

    return X, y