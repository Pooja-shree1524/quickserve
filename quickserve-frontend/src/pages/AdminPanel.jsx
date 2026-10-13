import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getQueue, generateToken, updateStatus, predictCrowd } from '../services/api.js'

/* ── constants ─────────────────────────────────── */
const NEXT_STATUS = {
  Waiting:  'Preparing',
  Preparing: 'Ready',
  Ready:    'Collected',
  Collected: null,
}

const ACTION_LABEL = {
  Waiting:  'Start Preparing',
  Preparing: 'Mark Ready',
  Ready:    'Mark Collected',
}

const STATUS_STYLE = {
  Waiting:   'bg-amber-100 text-amber-800 border-amber-200',
  Preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  Ready:     'bg-green-100 text-green-800 border-green-200',
  Collected: 'bg-gray-100 text-gray-600 border-gray-200',
}

const ACTION_STYLE = {
  Waiting:   'bg-blue-600 hover:bg-blue-500 text-white',
  Preparing: 'bg-green-600 hover:bg-green-500 text-white',
  Ready:     'bg-gray-700 hover:bg-gray-600 text-white',
}

const CROWD_STYLE = {
  LOW:      'bg-green-100 text-green-800',
  MODERATE: 'bg-amber-100 text-amber-800',
  HIGH:     'bg-red-100 text-red-800',
}

/** Compute pickup ETA: token.createdAt + estimatedPrepTime minutes */
function getPickupEta(token) {
  if (!token.createdAt || !token.estimatedPrepTime) return '—'
  try {
    const created = new Date(token.createdAt)
    const eta = new Date(created.getTime() + token.estimatedPrepTime * 60000)
    return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

function emptyItem() { return { name: '', complexity: 2 } }

/* ── component ─────────────────────────────────── */
export default function KitchenPanel() {
  const navigate = useNavigate()
  const [tab, setTab]             = useState('queue')    // 'queue' | 'generate'
  const [queue, setQueue]         = useState({ kitchenLoad: 0, preparing: [], waiting: [] })
  const [crowdInfo, setCrowdInfo] = useState(null)

  // token generation form
  const [customerName, setCustomerName] = useState('')
  const [items, setItems]               = useState([emptyItem()])
  const [genResult, setGenResult]       = useState(null)
  const [generating, setGenerating]     = useState(false)

  // queue action busy state
  const [busyToken, setBusyToken] = useState(null)

  /* ── polling ── */
  const loadQueue = useCallback(() => {
    getQueue().then(setQueue).catch(() => {})
  }, [])

  const loadCrowd = useCallback(() => {
    predictCrowd().then(setCrowdInfo).catch(() => {})
  }, [])

  useEffect(() => {
    loadQueue()
    loadCrowd()
    const qi = setInterval(loadQueue, 4000)
    const ci = setInterval(loadCrowd, 30000)
    return () => { clearInterval(qi); clearInterval(ci) }
  }, [loadQueue, loadCrowd])

  /* ── token generation ── */
  const updateItem = (i, field, val) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))

  const removeItem = i => setItems(prev => prev.filter((_, idx) => idx !== i))

  const handleGenerate = async (e) => {
    e.preventDefault()
    const clean = items
      .map(it => ({ name: it.name.trim(), complexity: Number(it.complexity) }))
      .filter(it => it.name)

    if (!customerName.trim() || clean.length === 0) {
      setGenResult({ ok: false, message: 'Enter a customer name and at least one item.' })
      return
    }

    setGenerating(true)
    setGenResult(null)
    try {
      const data = await generateToken({ customerName: customerName.trim(), items: clean })
      setGenResult({
        ok: true,
        message: `Token ${data.tokenNumber} generated — est. ${data.estimatedPrepTime} min`,
      })
      setCustomerName('')
      setItems([emptyItem()])
      loadQueue()
    } catch (err) {
      setGenResult({ ok: false, message: err.message || 'Failed to generate token.' })
    } finally {
      setGenerating(false)
    }
  }

  /* ── status advance ── */
  const advance = async (tokenNumber, currentStatus) => {
    const next = NEXT_STATUS[currentStatus]
    if (!next) return
    setBusyToken(tokenNumber)
    try {
      await updateStatus(tokenNumber, next)
      loadQueue()
    } catch (err) {
      alert(err.message || 'Update failed')
    } finally {
      setBusyToken(null)
    }
  }

  const allRows = [...queue.preparing, ...queue.waiting]

  return (
    <div className="min-h-screen bg-slate-50 font-body">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-slate-400 hover:text-slate-700 transition-colors text-sm mr-1"
              title="Back"
            >
              ←
            </button>
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-slate-900 font-bold text-sm">QS</div>
            <div>
              <h1 className="font-display text-lg font-semibold text-slate-900 leading-tight">Kitchen Panel</h1>
              <p className="text-xs text-slate-500">Live token & queue management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Kitchen Load */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-slate-600">Kitchen load:</span>
              <span className="font-bold text-slate-900">{queue.kitchenLoad}</span>
            </div>

            {/* AI Crowd Level */}
            {crowdInfo && (
              <div className={`rounded-full px-4 py-1.5 text-sm font-semibold ${CROWD_STYLE[crowdInfo.crowd_level] || 'bg-gray-100 text-gray-700'}`}>
                AI: {crowdInfo.crowd_level || 'LOW'} crowd
              </div>
            )}

            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              ⚙ Admin Dashboard
            </button>
            <button
              onClick={() => window.open('/queue', '_blank')}
              className="text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-900 px-3 py-1.5 rounded-lg transition-colors"
            >
              Live Board ↗
            </button>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="max-w-5xl mx-auto px-5 flex gap-0 border-t border-slate-100">
          {[
            { key: 'queue',    label: '🍳 Live Queue' },
            { key: 'generate', label: '+ Generate Token' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === key
                  ? 'border-amber-400 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* ══════ LIVE QUEUE TAB ══════ */}
        {tab === 'queue' && (
          <div>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Active Orders',    value: allRows.length,           color: 'text-slate-900' },
                { label: 'Preparing',        value: queue.preparing?.length ?? 0, color: 'text-blue-700' },
                { label: 'Waiting',          value: queue.waiting?.length ?? 0,   color: 'text-amber-700' },
                { label: 'Kitchen Load',     value: queue.kitchenLoad,        color: 'text-slate-900' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Queue table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-display font-semibold text-slate-900">Active Queue</h2>
                <button
                  onClick={loadQueue}
                  className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg"
                >
                  ↻ Refresh
                </button>
              </div>

              {allRows.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <p className="text-4xl mb-3">🍽</p>
                  <p className="text-sm">No active orders right now</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold">Token</th>
                      <th className="text-left px-5 py-3 font-semibold">Customer</th>
                      <th className="text-left px-5 py-3 font-semibold">Items</th>
                      <th className="text-left px-5 py-3 font-semibold">AI Wait (min)</th>
                      <th className="text-left px-5 py-3 font-semibold">Status</th>
                      <th className="text-left px-5 py-3 font-semibold">Pickup ETA</th>
                      <th className="text-left px-5 py-3 font-semibold">Position</th>
                      <th className="text-right px-5 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRows.map(t => (
                      <tr key={t.tokenNumber} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-slate-900 tracking-wide">{t.tokenNumber}</td>
                        <td className="px-5 py-3 text-slate-700">{t.customerName}</td>
                        <td className="px-5 py-3 text-slate-700">
                          {Array.isArray(t.items) && t.items.length > 0
                            ? t.items.map(i => (typeof i === 'string' ? i : i.name)).filter(Boolean).join(', ')
                            : '—'}
                        </td>
                        <td className="px-5 py-3 text-slate-700">{t.estimatedPrepTime ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-600'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-700 font-medium">{getPickupEta(t)}</td>
                        <td className="px-5 py-3 text-slate-500">#{t.queuePosition ?? '—'}</td>
                        <td className="px-5 py-3 text-right">
                          {NEXT_STATUS[t.status] ? (
                            <button
                              disabled={busyToken === t.tokenNumber}
                              onClick={() => advance(t.tokenNumber, t.status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors ${ACTION_STYLE[t.status] || 'bg-gray-500 text-white'}`}
                            >
                              {busyToken === t.tokenNumber ? '…' : ACTION_LABEL[t.status]}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══════ GENERATE TOKEN TAB ══════ */}
        {tab === 'generate' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="font-display font-semibold text-slate-900 text-lg">Generate Token</h2>
                <p className="text-slate-500 text-sm mt-0.5">Create a new token for a walk-in customer</p>
              </div>

              <form onSubmit={handleGenerate} className="px-6 py-5 space-y-5">
                {/* Customer name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Customer Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                </div>

                {/* Order items */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Order Items
                  </label>
                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Item name"
                          value={item.name}
                          onChange={e => updateItem(i, 'name', e.target.value)}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                        />
                        <select
                          value={item.complexity}
                          onChange={e => updateItem(i, 'complexity', Number(e.target.value))}
                          className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-700"
                        >
                          <option value={1}>Simple</option>
                          <option value={2}>Medium</option>
                          <option value={3}>Complex</option>
                        </select>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 border border-slate-200 rounded-lg"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems(prev => [...prev, emptyItem()])}
                    className="mt-2 w-full border border-dashed border-slate-300 text-slate-500 hover:text-slate-700 py-2 rounded-lg text-sm"
                  >
                    + Add item
                  </button>
                </div>

                {/* Result */}
                {genResult && (
                  <div className={`rounded-lg px-4 py-3 text-sm font-semibold ${
                    genResult.ok
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {genResult.ok ? '✓ ' : '✕ '}{genResult.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
                >
                  {generating ? 'Generating…' : 'Generate Token'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
