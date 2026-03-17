import math
from config import DEFAULT_HORIZONS, SENSOR_CLAMP_RANGES

EXPECTED_FIELDS = [
    "temperature",
    "humidity",
    "airQuality",
    "rainfall",
    "ldr"
]


class ValidationService:

    @staticmethod
    def validate_prediction_input(data):
        """Validate and clean a single sensor reading dict."""

        if data is None:
            raise ValueError("Request body is missing")

        if not isinstance(data, dict):
            raise ValueError("Request body must be a JSON object")

        missing = [f for f in EXPECTED_FIELDS if f not in data]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")

        cleaned = {}

        for field in EXPECTED_FIELDS:

            value = data[field]

            if value is None:
                raise ValueError(f"Field '{field}' cannot be null")

            try:
                value = float(value)
            except (TypeError, ValueError):
                raise ValueError(f"Field '{field}' must be numeric")

            if math.isnan(value) or math.isinf(value):
                raise ValueError(f"Field '{field}' contains invalid numeric value (NaN or Inf)")

            cleaned[field] = value

        # Sensor range validation
        if not (-20 <= cleaned["temperature"] <= 80):
            raise ValueError("Temperature out of valid range (-20 to 80°C)")

        if not (0 <= cleaned["humidity"] <= 100):
            raise ValueError("Humidity out of valid range (0 to 100%)")

        if cleaned["rainfall"] < 0:
            raise ValueError("Rainfall cannot be negative")

        if cleaned["ldr"] < 0:
            raise ValueError("LDR cannot be negative")

        if cleaned["airQuality"] < 0:
            raise ValueError("AirQuality cannot be negative")

        return cleaned

    @staticmethod
    def validate_horizons(data):
        """
        Extract and validate optional horizons_seconds from request body.
        Falls back to DEFAULT_HORIZONS if not provided.
        Returns a sorted, deduplicated list of positive integer seconds.
        """
        horizons_raw = data.get("horizons_seconds", None)

        if horizons_raw is None:
            return list(DEFAULT_HORIZONS)

        if not isinstance(horizons_raw, list):
            raise ValueError("'horizons_seconds' must be a JSON array of positive integers")

        if len(horizons_raw) == 0:
            raise ValueError("'horizons_seconds' must not be empty")

        if len(horizons_raw) > 20:
            raise ValueError("'horizons_seconds' cannot contain more than 20 horizons")

        validated = []
        for h in horizons_raw:
            try:
                h_int = int(h)
            except (TypeError, ValueError):
                raise ValueError(f"All values in 'horizons_seconds' must be integers, got: {h!r}")

            if h_int <= 0:
                raise ValueError(f"Horizon must be a positive integer, got: {h_int}")

            if h_int > 7200:  # max 2 hours
                raise ValueError(f"Horizon {h_int}s exceeds maximum allowed (7200s / 2 hours)")

            validated.append(h_int)

        # deduplicate and sort
        return sorted(set(validated))