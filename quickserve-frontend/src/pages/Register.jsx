import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/menu')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
