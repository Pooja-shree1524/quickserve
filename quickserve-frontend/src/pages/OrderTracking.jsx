import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrder } from '../services/api'
import StatusPipeline from '../components/StatusPipeline'

export default function OrderTracking() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await getOrder(id)
      setOrder(res.data)
    } catch (err) {
      console.error('Failed to fetch order', err)
    }
  }, [id])

  useEffect(() => {
    fetchOrder().finally(() => setLoading(false))
    // Poll every 10s so the status updates as the kitchen progresses the order
    const interval = setInterval(fetchOrder, 10000)
    return () => clearInterval(interval)
  }, [fetchOrder])

  if (loading) return <div className="max-w-2xl mx-auto px-5 py-16 text-ink/50">Loading order…</div>
  if (!order) return <div className="max-w-2xl mx-auto px-5 py-16 text-ink/50">Order not found.</div>

  const isDone = order.status === 'COLLECTED'
  const isReady = order.status === 'READY'
  const waitMinutes = order.predictedWaitingTime ?? order.estimatedWaitMinutes

  // Format estimated collection time
  const getFormattedCollectionTime = () => {
    if (order.estimatedCollectionTime) {
      try {
        const d = new Date(order.estimatedCollectionTime)
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      } catch {
        // fallback
      }
    }
    if (order.pickupTime) {
      try {
        const d = new Date(order.pickupTime)
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      } catch {
        // fallback
      }
    }
    if (order.createdAt && waitMinutes) {
      try {
        const d = new Date(new Date(order.createdAt).getTime() + waitMinutes * 60000)
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } catch {
        // fallback
      }
    }
    return '—'
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <Link to="/orders" className="text-sm text-clay font-medium hover:underline">← Back to orders</Link>

      {/* Main Order Confirmation & Prediction Card */}
      <div className="token-stub shadow-lg p-8 mt-6 mb-8 border border-mist/80 bg-cream">
        <div className="flex items-center justify-between border-b border-dashed border-mist/80 pb-3 mb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-leaf flex items-center gap-1">
            ✓ ORDER CONFIRMED
          </span>
          <span className="text-xs font-mono font-semibold text-ink/60">
            Order ID: QS{order.id}
          </span>
        </div>

        <div className="text-center my-4">
          <div className="text-xs uppercase tracking-widest text-ink/50 font-semibold mb-1">Your Token</div>
          <div className="font-display text-6xl text-clay tracking-tight font-bold">{order.token}</div>
        </div>

        <div className="dashed-divider my-6" />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm bg-white/70 rounded-xl p-4 border border-mist/50">
          <div>
            <div className="text-xs text-ink/50 uppercase font-semibold">AI Predicted Wait</div>
            <div className="font-display text-lg text-ink font-bold mt-0.5">
              {isDone ? '0 min' : isReady ? 'Ready Now' : `${waitMinutes ?? '—'} mins`}
            </div>
          </div>

          <div>
            <div className="text-xs text-ink/50 uppercase font-semibold">Estimated Collection</div>
            <div className="font-display text-lg text-ink font-bold mt-0.5">
              {isDone ? 'Collected' : isReady ? 'Pick Up Now' : getFormattedCollectionTime()}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <div className="text-xs text-ink/50 uppercase font-semibold">Order Status</div>
            <div className="font-semibold text-sm mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-ink/10 text-ink">
              <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-leaf animate-pulse' : 'bg-clay'}`} />
              {order.status}
            </div>
          </div>
        </div>

        {order.token && (
          <div className="mt-6 pt-4 border-t border-mist/80 text-center">
            <Link
              to="/queue"
              className="inline-flex items-center gap-2 bg-ink text-cream text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-leaf transition-colors shadow-sm"
            >
              📺 View on Live Queue Display →
            </Link>
          </div>
        )}
      </div>

      {/* Visual Pipeline */}
      <div className="bg-white border border-mist rounded-2xl p-6 mb-8 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-4">Order Progress</h3>
        <StatusPipeline status={order.status} />
      </div>

      {/* Order Items */}
      <div className="bg-white border border-mist rounded-2xl divide-y divide-mist shadow-sm overflow-hidden">
        <div className="p-4 bg-mist/30 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-ink/60">
          <span>Items Ordered ({order.items?.length || 0})</span>
          <span>Total: ₹{Number(order.totalAmount).toFixed(0)}</span>
        </div>
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between p-4 text-sm items-center">
            <span className="font-medium text-ink">{item.foodNameSnapshot} × {item.quantity}</span>
            <span className="text-ink/70 font-semibold">₹{(item.priceSnapshot * item.quantity).toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
