import React, { createContext, useContext, useState, useEffect } from 'react'
import api from './api'

type AuthContextType = {
  user: any | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('wagi_admin_user')
    if (raw) setUser(JSON.parse(raw))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/login', {
  email,
  password,
  device_name: 'admin-dashboard',
})
    const data = res.data
    localStorage.setItem('wagi_admin_token', data.token)
    localStorage.setItem('wagi_admin_user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('wagi_admin_token')
    localStorage.removeItem('wagi_admin_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
