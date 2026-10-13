import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, updateProfile, deleteAccount } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { clearVerificationCache } from './VerifyEmail'

export default function Profile() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Delete account state
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteAccount()
      clearVerificationCache()
      logout()
      navigate('/')
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account. Please try again.')
      setDeleting(false)
    }
  }

  if (loading) return <div className="max-w-md mx-auto px-5 py-16 text-ink/50">Loading profile…</div>

  return (
    <div className="max-w-md mx-auto px-5 py-10 space-y-10">
      {/* ── Profile form ── */}
      <div>
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

      {/* ── Danger zone ── */}
      <div className="border border-clay/30 rounded-2xl p-5 space-y-3 bg-clay/5">
        <h2 className="text-sm font-semibold text-clay uppercase tracking-wide">Danger Zone</h2>
        <p className="text-sm text-ink/70">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {deleteError && (
          <div className="bg-clay/10 text-clay text-sm rounded-lg px-4 py-2">{deleteError}</div>
        )}

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full border border-clay text-clay rounded-full py-2.5 text-sm font-medium hover:bg-clay hover:text-white transition-colors"
          >
            Delete my account
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-clay">Are you sure? This is permanent.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-clay text-white rounded-full py-2.5 text-sm font-medium hover:bg-clay/80 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Yes, delete account'}
              </button>
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); setDeleteError('') }}
                disabled={deleting}
                className="flex-1 border border-mist text-ink/70 rounded-full py-2.5 text-sm font-medium hover:bg-mist/40 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
