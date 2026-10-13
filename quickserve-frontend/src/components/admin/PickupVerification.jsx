/**
 * PickupVerification.jsx
 *
 * Uses html5-qrcode (Html5Qrcode class — NOT Html5QrcodeScanner).
 * The Html5Qrcode class gives full control: we manage start/stop ourselves,
 * and the library injects + manages its own <video> inside #qr-reader.
 *
 * IMPORTANT: Do NOT add a <video> element manually — html5-qrcode does it.
 *
 * Dedicated container: <div id="qr-reader"></div>
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { verifyPickup, markCollected } from '../../services/api'

/* ── Global CSS injected once — ensures video element is visible and properly sized ── */
const QR_READER_STYLES = `
#qr-reader {
    width: 100%;
    max-width: 500px;
}

#qr-reader video {
    width: 100% !important;
    height: auto !important;
    display: block !important;
    object-fit: cover !important;
}

#qr-reader__scan_region {
    width: 100% !important;
}

#qr-reader__scan_region video {
    width: 100% !important;
    height: auto !important;
    display: block !important;
    object-fit: cover !important;
}
`

function injectStyles() {
  if (document.getElementById('qs-qr-styles')) return
  const tag = document.createElement('style')
  tag.id = 'qs-qr-styles'
  tag.textContent = QR_READER_STYLES
  document.head.appendChild(tag)
}

/* ── Steps ────────────────────────────────────────────────────────────────── */
const STEP = {
  SCAN:       'SCAN',
  PIN_ENTRY:  'PIN_ENTRY',
  VERIFYING:  'VERIFYING',
  CONFIRMED:  'CONFIRMED',
  COLLECTING: 'COLLECTING',
  COLLECTED:  'COLLECTED',
  ERROR:      'ERROR',
}

/* ── Component ────────────────────────────────────────────────────────────── */
export default function PickupVerification() {
  const [step, setStep]               = useState(STEP.SCAN)
  const [scannerOn, setScannerOn]     = useState(false)
  const [qrToken, setQrToken]         = useState('')
  const [manualToken, setManualToken] = useState('')
  const [pin, setPin]                 = useState('')
  const [summary, setSummary]         = useState(null)
  const [error, setError]             = useState('')

  const scannerRef = useRef(null)   // Html5Qrcode instance
  const isStartingRef = useRef(false) // Guard against concurrent start calls

  // Inject CSS once on mount
  useEffect(() => {
    injectStyles()
  }, [])

  // ── Stop + clear scanner and reset reference ─────────────────────────────
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current
      scannerRef.current = null
      try {
        const state = scanner.getState()
        // State 2 = SCANNING, state 3 = PAUSED
        if (state === 2 || state === 3) {
          await scanner.stop()
        }
        scanner.clear()
      } catch (err) {
        console.error('[QR] Scanner cleanup error:', err)
      }
    }
    setScannerOn(false)
    isStartingRef.current = false
  }, [])

  // Clean up on unmount: stop, clear, and reset scanner instance
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        const scanner = scannerRef.current
        scannerRef.current = null
        try {
          const state = scanner.getState()
          if (state === 2 || state === 3) {
            scanner.stop().then(() => {
              try { scanner.clear() } catch (_) {}
            }).catch(err => {
              console.error('[QR] Scanner stop error on unmount:', err)
            })
          } else {
            scanner.clear()
          }
        } catch (err) {
          console.error('[QR] Scanner cleanup error on unmount:', err)
        }
      }
    }
  }, [])

  // ── Start scanner ───────────────────────────────────────────────────────
  const startScanner = async () => {
    setError('')

    // Prevent duplicate or concurrent instances if clicked repeatedly
    if (isStartingRef.current || scannerRef.current) {
      await stopScanner()
    }

    isStartingRef.current = true

    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      const config = {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
      }

      const onSuccess = (decodedText) => {
        console.log('[QR] QR Code detected:', decodedText)
        stopScanner()

        // Extract decoded pickup token (handle raw token or token query param)
        let token = (decodedText || '').trim()
        if (token.includes('token=')) {
          const match = token.match(/token=([^&]+)/)
          if (match && match[1]) {
            token = decodeURIComponent(match[1]).trim()
          }
        }

        setQrToken(token)
        setPin('')
        setError('')
        setStep(STEP.PIN_ENTRY)
      }

      const onError = () => {
        // Ignore QR-not-found errors while scanning.
      }

      // Try environment (rear) camera first, fall back to an available camera if not supported
      try {
        await scanner.start(
          { facingMode: 'environment' },
          config,
          onSuccess,
          onError
        )
        console.log('[QR] QR scanner started with environment camera')
      } catch (envError) {
        console.warn('[QR] Environment camera not supported, falling back to available camera:', envError)
        try {
          await scanner.start(
            { facingMode: 'user' },
            config,
            onSuccess,
            onError
          )
          console.log('[QR] QR scanner started with available front/user camera')
        } catch (fallbackErr) {
          const cameras = await Html5Qrcode.getCameras().catch(() => [])
          if (cameras.length > 0) {
            await scanner.start(
              cameras[0].id,
              config,
              onSuccess,
              onError
            )
            console.log('[QR] QR scanner started with camera ID:', cameras[0].id)
          } else {
            throw fallbackErr
          }
        }
      }

      setScannerOn(true)
    } catch (error) {
      console.error('[QR] QR scanner start error:', error)
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
          scannerRef.current.clear()
        } catch (cleanupErr) {
          console.error('[QR] Scanner cleanup error:', cleanupErr)
        }
        scannerRef.current = null
      }
      setScannerOn(false)

      // Surface clean error message based on error type
      const msg = error?.message || ''
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Camera permission denied. Allow camera access in your browser settings and try again.')
      } else if (msg.includes('NotFound') || msg.includes('Devices')) {
        setError('No camera found on this device. Use manual token entry below.')
      } else if (msg.includes('already') || msg.includes('busy')) {
        setError('Camera is in use by another application. Close it and try again.')
      } else {
        setError('Could not start camera. Use manual token entry below.')
      }
    } finally {
      isStartingRef.current = false
    }
  }

  // ── Step 2: verify QR + PIN ─────────────────────────────────────────────
  const handleVerifyPin = async () => {
    if (pin.length !== 4) {
      setError('Please enter the 4-digit PIN.')
      return
    }
    setStep(STEP.VERIFYING)
    setError('')
    try {
      const res = await verifyPickup({ pickupQrToken: qrToken, pickupPin: pin })
      if (res.data.valid) {
        setSummary(res.data)
        setStep(STEP.CONFIRMED)
      } else {
        setError(res.data.message || 'Verification failed.')
        setStep(STEP.ERROR)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Server error during verification.')
      setStep(STEP.ERROR)
    }
  }

  // ── Step 3: mark collected ──────────────────────────────────────────────
  const handleMarkCollected = async () => {
    setStep(STEP.COLLECTING)
    setError('')
    try {
      const res = await markCollected({ pickupQrToken: qrToken, pickupPin: pin })
      if (res.data.valid) {
        setSummary(res.data)
        setStep(STEP.COLLECTED)
      } else {
        setError(res.data.message || 'Could not mark as collected.')
        setStep(STEP.ERROR)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Server error during collection.')
      setStep(STEP.ERROR)
    }
  }

  const reset = async () => {
    await stopScanner()
    setStep(STEP.SCAN)
    setQrToken('')
    setManualToken('')
    setPin('')
    setSummary(null)
    setError('')
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Pickup Verification</h1>
        <p className="text-gray-600 text-sm mt-0.5">
          Scan the student's QR code or enter the token manually, then confirm their 4-digit PIN.
        </p>
      </div>

      <div className="max-w-lg space-y-4">

        {/* ── SCAN step ──────────────────────────────────────────── */}
        {step === STEP.SCAN && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-slate-800">Scan QR Code or Enter Token</h2>

            {error && (
              <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* html5-qrcode target container */}
            <div id="qr-reader"></div>

            {/* Camera controls */}
            {!scannerOn ? (
              <button
                type="button"
                onClick={startScanner}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white rounded-lg py-3 text-sm font-semibold hover:bg-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Start QR Scanner (Camera)
              </button>
            ) : (
              <button
                type="button"
                onClick={stopScanner}
                className="text-sm text-gray-500 hover:text-slate-700 transition-colors"
              >
                ✕ Stop Scanner
              </button>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">OR ENTER MANUALLY</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Manual entry */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pickup QR Token</label>
                <input
                  type="text"
                  value={manualToken}
                  onChange={e => setManualToken(e.target.value)}
                  placeholder="QSPICKUP-..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <button
                type="button"
                disabled={!manualToken.trim()}
                onClick={() => {
                  setQrToken(manualToken.trim())
                  setPin('')
                  setError('')
                  setStep(STEP.PIN_ENTRY)
                }}
                className="w-full bg-amber-500 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── VERIFYING / COLLECTING ─────────────────────────────── */}
        {(step === STEP.VERIFYING || step === STEP.COLLECTING) && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-center space-y-4">
            <div className={`animate-spin w-9 h-9 border-2 rounded-full mx-auto ${
              step === STEP.COLLECTING
                ? 'border-green-300 border-t-green-600'
                : 'border-slate-300 border-t-slate-700'
            }`} />
            <p className="text-sm text-gray-500">
              {step === STEP.COLLECTING ? 'Marking as collected…' : 'Verifying…'}
            </p>
          </div>
        )}

        {/* ── PIN ENTRY ──────────────────────────────────────────── */}
        {step === STEP.PIN_ENTRY && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-0.5">QR Code Accepted</p>
              <p className="font-mono text-xs text-blue-800 truncate">{qrToken}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Ask the student for their 4-digit Pickup PIN
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={e => { setError(''); setPin(e.target.value.replace(/\D/g, '').slice(0, 4)) }}
                placeholder="_ _ _ _"
                className="w-full text-center rounded-lg border border-gray-200 px-3 py-3 text-3xl font-mono tracking-[0.4em] font-bold focus:outline-none focus:ring-2 focus:ring-slate-300"
                autoFocus
              />
              {error && <p className="text-rose-600 text-sm mt-2 font-medium">{error}</p>}
            </div>

            <button
              type="button"
              onClick={handleVerifyPin}
              disabled={pin.length !== 4}
              className="w-full bg-slate-900 text-white rounded-lg py-3 text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-40"
            >
              Verify PIN & Show Order →
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-full text-sm text-gray-400 hover:text-slate-700 transition-colors"
            >
              ← Start Over
            </button>
          </div>
        )}

        {/* ── CONFIRMED — summary + Mark Collected ───────────────── */}
        {step === STEP.CONFIRMED && summary && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide">
                ✓ Verified — hand over the food
              </p>
            </div>
            <OrderSummaryCard summary={summary} />
            <button
              type="button"
              onClick={handleMarkCollected}
              className="w-full bg-green-600 text-white rounded-lg py-3 text-sm font-bold hover:bg-green-500 transition-colors"
            >
              ✓ MARK ORDER COLLECTED
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-full text-sm text-gray-400 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── COLLECTED — success ─────────────────────────────────── */}
        {step === STEP.COLLECTED && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-6 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-green-800 font-bold text-lg">ORDER VERIFIED ✓</h3>
              <p className="text-green-700 text-sm mt-1">Marked as COLLECTED successfully</p>
            </div>
            {summary && <OrderSummaryCard summary={summary} />}
            <button
              type="button"
              onClick={reset}
              className="w-full bg-slate-900 text-white rounded-lg py-3 text-sm font-bold hover:bg-slate-700 transition-colors"
            >
              Verify Next Order
            </button>
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────────── */}
        {step === STEP.ERROR && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-5 py-6 text-center">
              <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-rose-800 font-bold text-base">Verification Failed</h3>
              <p className="text-rose-700 text-sm mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="w-full bg-slate-900 text-white rounded-lg py-3 text-sm font-bold hover:bg-slate-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Order Summary sub-component ─────────────────────────────────────────── */
function OrderSummaryCard({ summary }) {
  const payLabel =
    summary.paymentStatus === 'DUMMY_PAID' ? 'PAID (TEST)' : summary.paymentStatus
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden text-sm">
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
        <div>
          <p className="text-xs text-gray-500">Token</p>
          <p className="font-mono font-bold text-slate-900 text-xl leading-tight">{summary.token}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Order</p>
          <p className="text-slate-700 font-semibold">QS{summary.orderId}</p>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {summary.items?.map((item, i) => (
          <div key={i} className="flex justify-between items-center px-4 py-2.5">
            <span className="text-slate-700 font-medium">{item.name}</span>
            <span className="text-gray-500 text-xs">× {item.quantity}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2 flex-wrap">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          summary.status === 'COLLECTED'
            ? 'bg-gray-200 text-gray-600'
            : 'bg-green-100 text-green-700'
        }`}>
          {summary.status}
        </span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          ['SUCCESS', 'DUMMY_PAID'].includes(summary.paymentStatus)
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {payLabel}
        </span>
      </div>
    </div>
  )
}
