import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as loginApi } from '../api/adminApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('qs_admin_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (email, password) => {
    const data = await loginApi(email, password);
    if (data.role !== 'ADMIN') {
      throw new Error('This account does not have admin access.');
    }
    localStorage.setItem('qs_admin_token', data.token);
    localStorage.setItem('qs_admin_user', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('qs_admin_token');
    localStorage.removeItem('qs_admin_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
