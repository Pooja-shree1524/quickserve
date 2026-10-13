import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmailToken, resendVerificationEmail } from '../services/api'

const tokenPromiseCache = new Map()
export const clearVerificationCache = () => tokenPromiseCache.clear()

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setSuccess(false)
      setMessage('Verification token is missing. Please check your verification link.')
      return
    }

    if (!tokenPromiseCache.has(token)) {
      tokenPromiseCache.set(token, verifyEmailToken(token))
    }

    let isMounted = true

    tokenPromiseCache
      .get(token)
      .then((res) => {
        if (!isMounted) return
        setSuccess(true)
        setMessage(res.data?.message || 'Email verified successfully. You can now log in.')
      })
      .catch((err) => {
        if (!isMounted) return
        setSuccess(false)
        setMessage(
          err.response?.data?.message ||
            'Verification failed. The token may be invalid, already used, or expired.'
        )
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [token])

  const handleResend = async (e) => {
    e.preventDefault()
    setResendMessage('')
    setResendSuccess(false)
    if (!resendEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendEmail)) {
      setResendMessage('Please enter a valid email address.')
      return
    }
    setResendLoading(true)
    try {
      const res = await resendVerificationEmail({ email: resendEmail })
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
    <div className="max-w-md mx-auto px-5 py-20 text-center">
      {loading ? (
        <div className="bg-white border border-mist rounded-2xl p-8 shadow-sm space-y-4">
          <div className="animate-spin w-10 h-10 border-2 border-ink/20 border-t-ink rounded-full mx-auto" />
          <h1 className="font-display text-2xl text-ink">Verifying your email…</h1>
          <p className="text-ink/60 text-sm">Please wait while we confirm your account.</p>
        </div>
      ) : success ? (
        <div className="bg-white border border-leaf/30 rounded-2xl p-8 shadow-sm space-y-5">
          <div className="w-14 h-14 bg-leaf/10 text-leaf rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h1 className="font-display text-2xl text-ink">Email verified successfully</h1>
          <p className="text-ink/70 text-sm">{message}</p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-block w-full bg-ink text-cream rounded-full py-3 font-medium hover:bg-leaf transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-clay/30 rounded-2xl p-8 shadow-sm space-y-5">
          <div className="w-14 h-14 bg-clay/10 text-clay rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✕
          </div>
          <h1 className="font-display text-2xl text-ink">Verification Failed</h1>
          <p className="text-clay text-sm font-medium">{message}</p>

          <div className="text-left border border-mist rounded-xl p-4 bg-mist/20 space-y-3">
            <p className="text-sm font-medium text-ink/80">Need a new verification link?</p>
            <label className="block">
              <span className="text-xs font-medium text-ink/60">Email address</span>
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40"
              />
            </label>
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
              className="w-full bg-clay/90 text-white rounded-full py-2.5 text-sm font-medium hover:bg-clay transition-colors disabled:opacity-50"
            >
              {resendLoading ? 'Sending…' : 'Resend verification email'}
            </button>
          </div>

          <div className="pt-2 space-y-2">
            <Link
              to="/login"
              className="inline-block w-full bg-ink text-cream rounded-full py-3 font-medium hover:bg-leaf transition-colors"
            >
              Back to Login
            </Link>
            <p className="text-xs text-ink/60">
              Need a new account?{' '}
              <Link to="/register" className="text-clay font-medium hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
