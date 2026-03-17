import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../socket';
import { ENDPOINTS, ML_ENDPOINTS, ADVANCED_ML_ENDPOINTS } from '../config';

const MAX_HISTORY = 60;

export function useSensorData() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const historyRef = useRef([]);

  // Load initial history from REST
  useEffect(() => {
    fetch(ENDPOINTS.sensorData)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data.length > 0) {
          const sorted = [...json.data].reverse().slice(0, MAX_HISTORY);
          historyRef.current = sorted;
          setHistory(sorted);
          setLatest(sorted[sorted.length - 1]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Subscribe to live WebSocket events
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onNewSensor = ({ data }) => {
      if (!data) return;
      setLatest(data);
      historyRef.current = [...historyRef.current, data].slice(-MAX_HISTORY);
      setHistory([...historyRef.current]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('sensor:new', onNewSensor);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('sensor:new', onNewSensor);
    };
  }, []);

  return { latest, history, connected, loading };
}

export function useMLPrediction(sensorData, modelType = 'standard') {
  const [mlPrediction, setMlPrediction] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState(null);
  const latestDataRef = useRef(sensorData);
  const abortRef = useRef(null);

  // Keep the ref up to date with the latest sensor data without re-subscribing
  useEffect(() => {
    latestDataRef.current = sensorData;
  }, [sensorData]);

  const fetchPrediction = useCallback(async () => {
    const data = latestDataRef.current;
    if (!data) return;

    // Selection logic
    const endpoint = modelType === 'advanced' 
      ? ADVANCED_ML_ENDPOINTS.predict 
      : ML_ENDPOINTS.predict;

    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setMlLoading(true);
    setMlError(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature: data.temperature,
          humidity: data.humidity,
          airQuality: data.airQuality,
          rainfall: data.rainfall,
          ldr: data.ldr,
        }),
        signal: controller.signal,
      });
      const json = await res.json();
      if (json.status === 'success') {
        // Standardize output format if needed (Advanced backend might return slightly different structure)
        setMlPrediction(json);
      } else {
        setMlError(json.message || 'ML prediction failed');
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setMlError(`${modelType.toUpperCase()} ML backend unreachable`);
      }
    } finally {
      setMlLoading(false);
    }
  }, [modelType]);

  // Fetch once on mount (when data arrives), then every 60 seconds
  useEffect(() => {
    if (!sensorData) return;               // wait for first data point
    fetchPrediction();                     // immediate first fetch

    const id = setInterval(fetchPrediction, 60_000);  // then every 60s
    return () => {
      clearInterval(id);
      if (abortRef.current) abortRef.current.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPrediction, modelType]);

  return { mlPrediction, mlLoading, mlError, refetch: fetchPrediction };
}
