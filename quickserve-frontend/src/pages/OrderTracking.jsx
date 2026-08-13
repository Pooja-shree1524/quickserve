import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrder } from '../services/api'
import StatusPipeline from '../components/StatusPipeline'

export default function OrderTracking() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = useCallback(async () => {
    const res = await getOrder(id)
    setOrder(res.data)
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

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <Link to="/orders" className="text-sm text-clay font-medium">← Back to orders</Link>

      <div className="token-stub shadow-md p-8 mt-6 mb-10">
        <div className="text-xs uppercase tracking-widest text-ink/40 mb-1">QuickServe Token</div>
        <div className="font-display text-5xl text-clay mb-2">{order.token}</div>
        <div className="dashed-divider my-4" />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-ink/50">Status</div>
            <div className="font-medium text-ink">{order.status}</div>
          </div>
          <div>
            <div className="text-ink/50">Est. wait</div>
            <div className="font-medium text-ink">
              {isDone ? 'Collected' : `${order.estimatedWaitMinutes ?? '—'} min`}
            </div>
          </div>
          <div>
            <div className="text-ink/50">Pickup time</div>
            <div className="font-medium text-ink">
              {order.pickupTime ? new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </div>
          </div>
          <div>
            <div className="text-ink/50">Total</div>
            <div className="font-medium text-ink">₹{Number(order.totalAmount).toFixed(0)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-mist rounded-2xl p-6 mb-8">
        <StatusPipeline status={order.status} />
      </div>

      <div className="bg-white border border-mist rounded-2xl divide-y divide-mist">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between p-4 text-sm">
            <span>{item.foodNameSnapshot} × {item.quantity}</span>
            <span className="text-ink/60">₹{(item.priceSnapshot * item.quantity).toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
