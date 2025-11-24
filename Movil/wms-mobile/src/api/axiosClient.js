import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ CAMBIA ESTO POR TU IP LOCAL
// Si usas emulador Android puedes usar '10.0.2.2'
// Si usas celular físico, usa tu IP: '192.168.x.x'
const BASE_URL = 'http://192.168.1.2:8000/api'; 

const api = axios.create({
  baseURL: BASE_URL,    
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para inyectar el token automáticamente
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores (ej. token expirado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      await AsyncStorage.removeItem('auth_token');
      // Aquí podrías redirigir al login o manejar el estado global
    }
    return Promise.reject(error);
  }
);

export default api;