import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axiosClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (usuario, password) => {
    try {
      const response = await api.post('/auth/login', { usuario, password });
      
      // Manejar diferentes formatos de respuesta
      const data = response.data.data || response.data;
      const token = data.token || data.data?.token;
      const userData = data.usuario || data.data?.usuario;
      
      if (!token || !userData) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      setUserToken(token);
      setUserInfo(userData);
      
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user_info', JSON.stringify(userData));
    } catch (error) {
      console.log('Login error:', error);
      throw error; // Para manejar el error en la pantalla de Login
    }
  };

  const logout = async () => {
    try {
      // Opcional: llamar al endpoint de logout
      // await api.post('/auth/logout'); 
    } catch (e) {
      console.error(e);
    } finally {
      setUserToken(null);
      setUserInfo(null);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_info');
    }
  };

  const isLoggedIn = async () => {
    try {
      let token = await AsyncStorage.getItem('auth_token');
      let userInfo = await AsyncStorage.getItem('user_info');
      
      if (token) {
        setUserToken(token);
        setUserInfo(JSON.parse(userInfo));
      }
    } catch (e) {
      console.log(`Error check login: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userInfo }}>
      {children}
    </AuthContext.Provider>
  );
};