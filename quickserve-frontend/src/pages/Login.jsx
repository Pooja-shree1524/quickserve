import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resendVerificationEmail } from '../services/api'

export default function Login() {
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const [loginType, setLoginType] = useState('STUDENT') // 'STUDENT' | 'ADMIN'
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShowResend(false)
    setResendMessage('')
    setLoading(true)
    try {
      const authData = await login(form)

      if (loginType === 'ADMIN') {
        if (authData.role !== 'ADMIN') {
          logout()
          setError('Access denied. This account does not have Admin privileges.')
          return
        }
        navigate('/admin/dashboard')
      } else {
        navigate('/menu')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.'
      setError(msg)
      if (loginType === 'STUDENT' && typeof msg === 'string' && msg.toLowerCase().includes('verify your email')) {
        setShowResend(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async (e) => {
    e.preventDefault()
    setResendMessage('')
    setResendSuccess(false)
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setResendMessage('Please enter a valid email address above first.')
      return
    }
    setResendLoading(true)
    try {
      const res = await resendVerificationEmail({ email: form.email })
      setResendSuccess(true)
      setResendMessage(res.data?.message || 'If the email matches an unverified account, a new verification link has been sent.')
    } catch (err) {
      setResendSuccess(false)
      setResendMessage(err.response?.data?.message || 'Something went wrong. Please try again later.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-display text-3xl text-ink mb-2">Welcome back</h1>
      <p className="text-ink/60 mb-6">Log in to pick up where you left off.</p>

      {/* Role Selector Tabs */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60 mb-2">
          Select Login Type
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-mist/60 rounded-xl border border-mist">
          <button
            type="button"
            onClick={() => {
              setLoginType('STUDENT')
              setError('')
            }}
            className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
              loginType === 'STUDENT'
                ? 'bg-ink text-cream shadow-sm'
                : 'text-ink/60 hover:text-ink'
            }`}
          >
            🎓 Student
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType('ADMIN')
              setError('')
            }}
            className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
              loginType === 'ADMIN'
                ? 'bg-ink text-cream shadow-sm'
                : 'text-ink/60 hover:text-ink'
            }`}
          >
            ⚙ Admin
          </button>
        </div>
      </div>

      {error && <div className="bg-clay/10 text-clay text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink/80">Email</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder={loginType === 'ADMIN' ? 'admin@quickserve.com' : 'student@example.com'}
            className="mt-1 w-full rounded-lg border border-mist bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-leaf/40"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink/80">Password</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-mist bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-leaf/40"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-cream rounded-full py-3 font-medium hover:bg-leaf transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in…' : `Log in as ${loginType === 'ADMIN' ? 'Admin' : 'Student'}`}
        </button>
      </form>

      {showResend && (
        <div className="mt-5 border border-leaf/20 bg-leaf/5 rounded-xl p-4 space-y-3">
          <p className="text-sm text-ink/80 font-medium">
            Your account is not verified yet.
          </p>
          {resendMessage && (
            <div
              className={`text-sm rounded-lg px-3 py-2 ${
                resendSuccess ? 'bg-leaf/10 text-leaf' : 'bg-clay/10 text-clay'
              }`}
            >
              {resendMessage}
            </div>
          )}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full text-sm font-medium text-clay hover:underline disabled:opacity-50"
          >
            {resendLoading ? 'Sending…' : 'Resend verification email'}
          </button>
        </div>
      )}

      {loginType === 'STUDENT' && (
        <p className="text-sm text-ink/60 mt-6 text-center">
          New to QuickServe? <Link to="/register" className="text-clay font-medium">Create an account</Link>
        </p>
      )}
    </div>
  )
}

