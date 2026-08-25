import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('partner_token');
    if (token) {
      api.me()
        .then(res => setHotel(res.hotel))
        .catch(() => localStorage.removeItem('partner_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('partner_token', res.token);
    setHotel(res.hotel);
    return res;
  };

  const register = async (data) => {
    const res = await api.register(data);
    localStorage.setItem('partner_token', res.token);
    setHotel(res.hotel);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('partner_token');
    setHotel(null);
  };

  const refreshHotel = async () => {
    const res = await api.getHotel();
    setHotel(res.hotel);
  };

  return (
    <AuthContext.Provider value={{ hotel, loading, login, register, logout, refreshHotel }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
