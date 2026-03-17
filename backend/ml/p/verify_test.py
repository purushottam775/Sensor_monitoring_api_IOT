"""
Verification test for the upgraded Python ML backend.
Run from: d:\\New folder (7)\\sr\\backend\\ml\\p\\
Command:  venv\\Scripts\\python.exe verify_test.py
"""
import sys
sys.path.insert(0, '.')

failures = []

def check(label, got, expected=True):
    if callable(expected):
        ok = expected(got)
    elif isinstance(expected, type) and issubclass(expected, Exception):
        ok = isinstance(got, expected)
    else:
        ok = (got == expected)
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {label}: {got}")
    if not ok:
        failures.append(label)

print("=" * 60)
print("1. Config")
print("=" * 60)
from config import API_PORT, DEFAULT_HORIZONS, SENSOR_CLAMP_RANGES, SENSOR_INTERVAL_SECONDS
check("API_PORT == 5001", API_PORT, 5001)
check("DEFAULT_HORIZONS", DEFAULT_HORIZONS, [30, 60, 120, 300, 600])
check("SENSOR_INTERVAL_SECONDS == 10", SENSOR_INTERVAL_SECONDS, 10)
check("CLAMP keys", sorted(SENSOR_CLAMP_RANGES.keys()), sorted(["temperature","humidity","airQuality","rainfall","ldr"]))

print()
print("=" * 60)
print("2. ValidationService")
print("=" * 60)
from services.validation_service import ValidationService

cleaned = ValidationService.validate_prediction_input({
    "temperature": 28.5, "humidity": 65.0, "airQuality": 300,
    "rainfall": 800, "ldr": 600
})
check("cleaned.temperature", cleaned["temperature"], 28.5)

horizons = ValidationService.validate_horizons({"horizons_seconds": [30, 60, 120]})
check("custom horizons", horizons, [30, 60, 120])

default_h = ValidationService.validate_horizons({})
check("default horizons", default_h, [30, 60, 120, 300, 600])

# Error cases
try:
    ValidationService.validate_prediction_input({"temperature": 28.5})
    check("missing fields error", False)
except ValueError as e:
    check("missing fields error raises ValueError", True)

try:
    ValidationService.validate_prediction_input({
        "temperature": 200, "humidity": 65, "airQuality": 300, "rainfall": 800, "ldr": 600
    })
    check("out-of-range temp error", False)
except ValueError:
    check("out-of-range temp raises ValueError", True)

print()
print("=" * 60)
print("3. ModelService")
print("=" * 60)
from services.model_service import ModelService
ms = ModelService()
check("model_exists()", ms.model_exists(), True)
clamped = ModelService.clamp_prediction({
    "temperature": 100.0, "humidity": 120.0,
    "airQuality": -5.0, "rainfall": 9999.0, "ldr": -10.0
})
check("clamp temperature<=80", clamped["temperature"], 80.0)
check("clamp humidity<=100", clamped["humidity"], 100.0)
check("clamp airQuality>=0", clamped["airQuality"], 0.0)
check("clamp rainfall<=4095", clamped["rainfall"], 4095.0)
check("clamp ldr>=0", clamped["ldr"], 0.0)

print()
print("=" * 60)
print("4. PredictService utilities")
print("=" * 60)
from services.predict_service import _get_sensor_status, _get_aqi_category, _label_for_seconds

check("temp 28 => safe", _get_sensor_status("temperature", 28), "safe")
check("temp 5 => danger (below 10)", _get_sensor_status("temperature", 5), "danger")
check("temp 12 => warning (10-15)", _get_sensor_status("temperature", 12), "warning")
check("temp -10 => danger", _get_sensor_status("temperature", -10), "danger")
check("humidity 60 => safe", _get_sensor_status("humidity", 60), "safe")
check("aqi 300 => Good", _get_aqi_category(300), "Good")
check("aqi 800 => Moderate", _get_aqi_category(800), "Moderate")
check("aqi 2000 => Very Unhealthy", _get_aqi_category(2000), "Very Unhealthy")
check("label 30s", _label_for_seconds(30), "+30s")
check("label 60s", _label_for_seconds(60), "+1min")
check("label 600s", _label_for_seconds(600), "+10min")
check("label 120s", _label_for_seconds(120), "+2min")

print()
print("=" * 60)
print("5. SensorPredictor — real model inference")
print("=" * 60)
from services.predict_service import SensorPredictor
p = SensorPredictor()

sample = {"temperature": 28.5, "humidity": 65.0, "airQuality": 300, "rainfall": 800, "ldr": 600}

single = p.predict(sample)
check("single step returns dict", isinstance(single, dict))
check("single step has temperature", "temperature" in single)

multi = p.predict_horizons(sample)
check("multi has sensor_interval_seconds", "sensor_interval_seconds" in multi)
check("multi has 5 horizons", len(multi["horizons"]), 5)
h0 = multi["horizons"][0]
check("horizon[0] label +30s", h0["horizon_label"], "+30s")
check("horizon has timestamp", "timestamp" in h0)
check("horizon has status dict", isinstance(h0["status"], dict))
check("horizon has aqi_category", "aqi_category" in h0)
check("horizon has anomaly bool", isinstance(h0["anomaly"], bool))
check("humidity clamped 0-100", h0["humidity"], lambda v: 0 <= v <= 100)
check("temperature clamped -20..80", h0["temperature"], lambda v: -20 <= v <= 80)

# Custom horizons
multi2 = p.predict_horizons(sample, horizons_seconds=[60, 300])
check("custom 2 horizons count", len(multi2["horizons"]), 2)
check("custom h1 label +1min", multi2["horizons"][0]["horizon_label"], "+1min")
check("custom h2 label +5min", multi2["horizons"][1]["horizon_label"], "+5min")

print()
print("=" * 60)
print(f"RESULTS: {len(failures)} failure(s)")
if failures:
    print("FAILED:", failures)
else:
    print("ALL TESTS PASSED!")
print("=" * 60)
