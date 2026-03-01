/**
 * ══════════════════════════════════════════════════════════════════
 *  SENSOR THRESHOLD & STATUS LOGIC  —  Single Source of Truth
 * ══════════════════════════════════════════════════════════════════
 */

export const SENSOR_KEYS = ['temperature', 'humidity', 'airQuality', 'rainfall', 'ldr'];

// Used for normalization in ML
export const SENSOR_RANGES = {
    temperature: { min: -20, max: 60 },
    humidity: { min: 0, max: 100 },
    airQuality: { min: 0, max: 4095 }, // ESP32 range
    rainfall: { min: 0, max: 4095 },
    ldr: { min: 0, max: 4095 },
};

export const getTempStatus = (v) => {
    if (v === null || v === undefined) return { status: "ERROR", label: "NO DATA" };
    if (v <= -10 || v === -41) return { status: "ERROR", label: "SENSOR ERR" };
    if (v < 10) return { status: "WARNING", label: "COLD" };
    if (v <= 35) return { status: "SAFE", label: "NORMAL" };
    if (v <= 45) return { status: "WARNING", label: "HOT" };
    return { status: "DANGER", label: "EXTREME" };
};

export const getHumidityStatus = (v) => {
    if (v === null || v === undefined) return { status: "ERROR", label: "NO DATA" };
    if (v <= 5) return { status: "ERROR", label: "SENSOR ERR" };
    if (v < 30) return { status: "WARNING", label: "DRY" };
    if (v <= 70) return { status: "SAFE", label: "NORMAL" };
    if (v <= 85) return { status: "WARNING", label: "HUMID" };
    return { status: "DANGER", label: "EXTREME" };
};

export const getAirStatus = (v) => {
    if (v === null || v === undefined) return { status: "ERROR", label: "NO DATA" };
    if (v < 1200) return { status: "SAFE", label: "GOOD" };
    if (v < 2000) return { status: "WARNING", label: "MODERATE" };
    if (v < 3000) return { status: "WARNING", label: "POOR" };
    return { status: "DANGER", label: "HAZARDOUS" };
};

export const getRainStatus = (v) => {
    if (v === null || v === undefined) return { status: "ERROR", label: "NO DATA" };
    if (v > 3500) return { status: "SAFE", label: "DRY" };
    if (v > 2000) return { status: "SAFE", label: "LIGHT RAIN" };
    if (v > 1000) return { status: "WARNING", label: "MODERATE RAIN" };
    return { status: "DANGER", label: "HEAVY RAIN" };
};

export const getLdrStatus = (v) => {
    if (v === null || v === undefined) return { status: "ERROR", label: "NO DATA" };
    if (v === 0) return { status: "ERROR", label: "NOT CONNECTED" };
    if (v < 800) return { status: "WARNING", label: "DARK" };
    if (v <= 2000) return { status: "SAFE", label: "NORMAL" };
    return { status: "SAFE", label: "BRIGHT" };
};

export const getOverallStatus = (statusMap) => {
    const vals = Object.values(statusMap);
    if (vals.includes("DANGER")) return "DANGER";
    if (vals.includes("WARNING") || vals.includes("ERROR")) return "WARNING";
    return "SAFE";
};

// Simplified numeric thresholds specifically for time-to-danger calculations
export const DANGER_THRESHOLDS = {
    temperature: 45,
    humidity: 85,
    airQuality: 3000,
    rainfall: 1000, // less than this is danger
    ldr: 0,
};
