import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentToken, getToken } from '../services/api.js'

const STEPS = ['Waiting', 'Preparing', 'Ready', 'Collected']

const STATUS_COLOR = {
  Waiting:   { bg: 'bg-amber-50',   border: 'border-amber-300',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  Preparing: { bg: 'bg-blue-50',    border: 'border-blue-300',   text: 'text-blue-700',   dot: 'bg-blue-500'  },
  Ready:     { bg: 'bg-green-50',   border: 'border-green-300',  text: 'text-green-700',  dot: 'bg-green-500' },
  Collected: { bg: 'bg-gray-50',    border: 'border-gray-300',   text: 'text-gray-600',   dot: 'bg-gray-400'  },
}

export default function CustomerQueue() {
  const [board, setBoard]           = useState({ currentToken: null, currentStatus: null, next: [] })
  const [tokenInput, setTokenInput] = useState('')
  const [trackedToken, setTracked]  = useState(null)
  const [trackedStatus, setStatus]  = useState(null)
  const [error, setError]           = useState('')
  const [pulse, setPulse]           = useState(false)
  const lastRef                     = useRef(null)

  /* ── board polling ── */
  const refreshBoard = useCallback(() => {
    getCurrentToken().then(d => setBoard(d)).catch(() => {})
  }, [])

  useEffect(() => {
    refreshBoard()
    const id = setInterval(refreshBoard, 3000)
    return () => clearInterval(id)
  }, [refreshBoard])

  /* ── token tracking ── */
  useEffect(() => {
    if (!trackedToken) return
    const refresh = () => {
      getToken(trackedToken)
        .then(data => {
          setError('')
          setStatus(data.status)
          if (data.status === 'Ready' && lastRef.current !== 'Ready') {
            setPulse(true)
            setTimeout(() => setPulse(false), 4000)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('QuickServe 🔔', { body: `Token ${data.tokenNumber} is ready — collect now!` })
            }
          }
          lastRef.current = data.status
        })
        .catch(e => setError(e.message))
    }
    refresh()
    const id = setInterval(refresh, 3000)
    return () => clearInterval(id)
  }, [trackedToken])

  const handleTrack = () => {
    const val = tokenInput.trim().toUpperCase()
    if (!val) return
    lastRef.current = null
    setStatus(null)
    setTracked(val)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const activeIndex = STEPS.indexOf(trackedStatus)
  const sc = STATUS_COLOR[trackedStatus] || {}

  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1410] to-[#0a0d0b] text-white font-body">
      {/* Back link */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="text-white/30 hover:text-white/70 text-xs transition-colors flex items-center gap-1"
        >
          ← Back to app
        </button>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-[0.2em] text-green-500/70 font-semibold">QuickServe</span>
          <h1 className="font-display text-3xl font-bold text-white mt-2">Live Queue Display</h1>
          <p className="text-white/40 text-sm mt-1">Auto-refreshes every 3 seconds</p>
        </div>

        {/* Now Serving Board */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 mb-5 text-center shadow-2xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-3">Now Serving</p>
          <div
            className="font-mono text-[88px] leading-none tracking-widest text-amber-400 mb-3"
            style={{ textShadow: '0 0 40px rgba(251,191,36,0.35)' }}
          >
            {board.currentToken || '—'}
          </div>
          {board.currentStatus && (
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {board.currentStatus}
            </span>
          )}

          {/* Up Next */}
          {board.next && board.next.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3">Up Next</p>
              <div className="flex justify-center gap-3 flex-wrap">
                {board.next.map(t => (
                  <span key={t} className="font-mono text-lg text-amber-400/70 bg-white/5 border border-white/10 px-4 py-1.5 rounded-lg tracking-widest">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(!board.currentToken && !(board.next?.length)) && (
            <p className="text-white/30 text-sm mt-4">No active orders right now</p>
          )}
        </div>

        {/* Token Tracker */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="font-display text-lg font-semibold text-white mb-4">Track your order</h2>

          <div className="flex gap-3 mb-6">
            <input
              className="flex-1 bg-black/40 border border-white/15 rounded-xl px-4 py-3 font-mono text-lg text-white tracking-widest uppercase placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              placeholder="e.g. QS-1042"
              maxLength={10}
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTrack()}
            />
            <button
              onClick={handleTrack}
              className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Track
            </button>
          </div>

          {/* Progress Steps */}
          {trackedToken && (
            <>
              <div className="flex gap-2 mb-4">
                {STEPS.map((s, i) => {
                  const isDone   = i < activeIndex
                  const isActive = i === activeIndex
                  return (
                    <div
                      key={s}
                      className={`flex-1 text-center py-2.5 rounded-lg text-xs font-semibold border transition-all duration-300 ${
                        isActive ? 'bg-amber-400/15 border-amber-400 text-amber-300' :
                        isDone   ? 'bg-green-500/15 border-green-500/50 text-green-400' :
                                   'bg-white/5 border-white/10 text-white/30'
                      }`}
                    >
                      {isDone ? '✓ ' : ''}{s}
                    </div>
                  )
                })}
              </div>

              {trackedStatus && (
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${sc.bg} ${sc.border} ${sc.text}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${sc.dot} ${trackedStatus === 'Ready' ? 'animate-ping' : ''}`} />
                  Token {trackedToken} — {trackedStatus}
                </div>
              )}
            </>
          )}

          {/* Ready banner */}
          {trackedStatus === 'Ready' && (
            <div className={`mt-4 bg-green-500/15 border border-green-400 rounded-xl px-4 py-4 text-green-300 text-sm font-semibold text-center ${pulse ? 'animate-pulse' : ''}`}>
              🔔 Your order is ready — collect within 10 minutes!
            </div>
          )}

          {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
        </div>

        <p className="text-center text-white/20 text-xs mt-8">QuickServe · Smart Token & Queue Module</p>
      </div>
    </div>
  )
}
