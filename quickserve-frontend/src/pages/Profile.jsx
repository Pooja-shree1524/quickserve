import React, { useEffect, useState } from 'react'
import { getProfile, updateProfile } from '../services/api'

export default function Profile() {
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getProfile().then((res) => {
      setForm({ name: res.data.name, phone: res.data.phone || '', email: res.data.email })
    }).finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    setSaved(false)
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile({ name: form.name, phone: form.phone })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-md mx-auto px-5 py-16 text-ink/50">Loading profile…</div>

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      <h1 className="font-display text-3xl text-ink mb-6">Your profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink/80">Full name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-mist bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-leaf/40"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink/80">Phone</span>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-mist bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-leaf/40"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink/80">Email</span>
          <input
            value={form.email}
            disabled
            className="mt-1 w-full rounded-lg border border-mist bg-mist/60 px-4 py-2.5 text-ink/50"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-ink text-cream rounded-full py-3 font-medium hover:bg-leaf transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
