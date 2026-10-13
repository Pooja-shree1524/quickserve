import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(null) // holds { emailSent, message, email }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await register(form)
      setRegistered({ emailSent: data.emailSent !== false, message: data.message, email: form.email })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Post-registration confirmation screen ──────────────────────────────────
  if (registered) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center">
        <div className={`bg-white rounded-2xl p-8 shadow-sm space-y-5 border ${registered.emailSent ? 'border-leaf/30' : 'border-amber-300'}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto text-2xl font-bold ${registered.emailSent ? 'bg-leaf/10 text-leaf' : 'bg-amber-100 text-amber-600'}`}>
            {registered.emailSent ? '✓' : '!'}
          </div>
          <h1 className="font-display text-2xl text-ink">Account created!</h1>
          <p className="text-ink/70 text-sm">
            {registered.emailSent
              ? <>We've sent a verification link to <strong>{registered.email}</strong>. Please check your inbox (and spam folder) and click the link to activate your account.</>
              : registered.message
            }
          </p>
          {!registered.emailSent && (
            <Link
              to="/verify-email"
              className="inline-block text-sm text-clay font-medium hover:underline"
            >
              Resend verification email →
            </Link>
          )}
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-block w-full bg-ink text-cream rounded-full py-3 font-medium hover:bg-leaf transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Registration form ──────────────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-display text-3xl text-ink mb-2">Create your account</h1>
      <p className="text-ink/60 mb-8">Pre-order in seconds, skip the counter entirely.</p>

      {error && <div className="bg-clay/10 text-clay text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" name="name" value={form.name} onChange={handleChange} required />
        <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        <Field label="Phone (optional)" name="phone" value={form.phone} onChange={handleChange} />
        <Field label="Password" name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-cream rounded-full py-3 font-medium hover:bg-leaf transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6 text-center">
        Already have an account? <Link to="/login" className="text-clay font-medium">Log in</Link>
      </p>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, required, minLength }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/80">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        className="mt-1 w-full rounded-lg border border-mist bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-leaf/40"
      />
    </label>
  )
}
