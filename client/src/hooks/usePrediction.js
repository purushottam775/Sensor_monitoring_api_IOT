import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { sensorAPI } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const usePrediction = () => {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);

    // Fetch initial prediction from REST
    const fetchPrediction = useCallback(async () => {
        try {
            const res = await sensorAPI.getPrediction();
            if (res.data?.success && res.data?.data) {
                setPrediction(res.data.data);
            }
        } catch {
            // Backend offline or prediction not ready yet — silent fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrediction();

        // Reuse or create the socket connection
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        // Live prediction updates from backend LSTM
        socket.on('sensor:prediction', (data) => {
            if (data) setPrediction(data);
            setLoading(false);
        });

        return () => socket.disconnect();
    }, [fetchPrediction]);

    return { prediction, loading, refetch: fetchPrediction };
};
