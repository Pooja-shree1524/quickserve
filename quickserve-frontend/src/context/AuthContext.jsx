import React, { createContext, useContext, useState, useCallback } from 'react'
import { loginUser, registerUser } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('qs_user')
    return stored ? JSON.parse(stored) : null
  })

  const persist = (authResponse) => {
    localStorage.setItem('qs_token', authResponse.token)
    const userData = {
      id: authResponse.userId,
      name: authResponse.name,
      email: authResponse.email,
      role: authResponse.role,
    }
    localStorage.setItem('qs_user', JSON.stringify(userData))
    setUser(userData)
  }

  const login = useCallback(async (credentials) => {
    const res = await loginUser(credentials)
    persist(res.data)
    return res.data
  }, [])

  const register = useCallback(async (details) => {
    const res = await registerUser(details)
    // Do NOT persist: user must verify email before they can log in
    return res.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('qs_token')
    localStorage.removeItem('qs_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
