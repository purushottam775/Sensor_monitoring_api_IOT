import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
});

export const sensorAPI = {
    getAll: () => api.get('/sensor'),
    getLatest: () => api.get('/sensor/latest'),
    postData: (data) => api.post('/sensor', data),
    getPrediction: () => api.get('/sensor/prediction'),
};

export default api;
