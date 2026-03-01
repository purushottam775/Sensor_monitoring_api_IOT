import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { sensorAPI } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const MAX_HISTORY = 50;

// ── Mock data generator (used when backend is offline) ──────────
const generateMockHistory = (count = 20) => {
    const now = Date.now();
    return Array.from({ length: count }, (_, i) => ({
        _id: `mock-${i}`,
        temperature: parseFloat((20 + Math.random() * 15).toFixed(1)),
        humidity: parseFloat((40 + Math.random() * 40).toFixed(1)),
        airQuality: parseInt(100 + Math.random() * 600),
        rainfall: parseFloat((Math.random() * 60).toFixed(1)),
        ldr: parseInt(Math.random() * 1023),
        timestamp: new Date(now - (count - i) * 10000).toISOString(),
    }));
};

export const useSensorData = () => {
    const [history, setHistory] = useState([]);
    const [latest, setLatest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLive, setIsLive] = useState(false);
    const [socketId, setSocketId] = useState(null);

    const socketRef = useRef(null);
    const isMockRef = useRef(false);

    // ── Step 1: Load initial history via REST ─────────────────────
    const loadInitialData = useCallback(async () => {
        try {
            const [allRes, latestRes] = await Promise.all([
                sensorAPI.getAll(),
                sensorAPI.getLatest(),
            ]);
            const allData = (allRes.data?.data || []).reverse(); // oldest first
            const latestData = latestRes.data?.data || null;

            setHistory(allData);
            setLatest(latestData);
            setError(null);
            isMockRef.current = false;
        } catch {
            // Backend offline → use mock data
            isMockRef.current = true;
            const mock = generateMockHistory(20);
            setHistory(mock);
            setLatest(mock[mock.length - 1]);
            setError('Backend offline — showing demo data');
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Step 2: Connect Socket.io after initial load ──────────────
    useEffect(() => {
        loadInitialData();

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            timeout: 5000,
        });

        socketRef.current = socket;

        // Connected
        socket.on('connect', () => {
            console.log('🔌 WebSocket connected:', socket.id);
            setIsLive(true);
            setSocketId(socket.id);
            setError(null);
            // Re-load clean data from backend when we reconnect
            if (isMockRef.current) loadInitialData();
        });

        // Disconnected
        socket.on('disconnect', (reason) => {
            console.warn('❌ WebSocket disconnected:', reason);
            setIsLive(false);
            setSocketId(null);
            setError(`Connection lost: ${reason}`);
        });

        // Reconnecting
        socket.on('reconnect_attempt', (attempt) => {
            setError(`Reconnecting... (attempt ${attempt})`);
        });

        // Failed to reconnect at all
        socket.on('reconnect_failed', () => {
            setError('Backend offline — showing demo data');
            if (history.length === 0) {
                const mock = generateMockHistory(20);
                setHistory(mock);
                setLatest(mock[mock.length - 1]);
            }
        });

        // ⭐ Real-time: new sensor reading from NodeMCU
        socket.on('sensor:new', ({ data }) => {
            if (!data) return;
            setLatest(data);
            setHistory(prev => {
                const updated = [...prev, data];
                // Keep only MAX_HISTORY entries (trim oldest)
                return updated.length > MAX_HISTORY
                    ? updated.slice(updated.length - MAX_HISTORY)
                    : updated;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [loadInitialData]);

    // ── Manual refresh ─────────────────────────────────────────────
    const refetch = useCallback(async () => {
        await loadInitialData();
    }, [loadInitialData]);

    return {
        history,
        latest,
        loading,
        error,
        isLive,
        socketId,
        refetch,
    };
};
