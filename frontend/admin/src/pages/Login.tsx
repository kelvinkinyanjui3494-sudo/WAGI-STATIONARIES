import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const auth = useAuth()
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await auth.login(email.trim(), password)
      nav('/')
    } catch (err: any) {
      console.error('LOGIN ERROR:', err)

      if (err?.response) {
        setError(
          err.response.data?.message ||
          `Server returned ${err.response.status}`
        )
      } else if (err?.request) {
        setError(
          'Could not connect to the Laravel backend. Make sure php artisan serve is running.'
        )
      } else {
        setError(err?.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-semibold mb-6">
          WAGI - Admin Login
        </h1>

        <form onSubmit={submit}>
          <label className="block mb-2">Email</label>

          <input
            type="email"
            required
            className="w-full border p-2 rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
          />

          <label className="block mb-2">Password</label>

          <input
            type="password"
            required
            className="w-full border p-2 rounded mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}