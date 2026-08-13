import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrders } from '../services/api'

const STATUS_COLORS = {
  PLACED: 'bg-mist text-ink/70',
  ACCEPTED: 'bg-saffron/20 text-clay',
  PREPARING: 'bg-saffron/20 text-clay',
  READY: 'bg-leaf/20 text-leaf',
  COLLECTED: 'bg-ink/10 text-ink/60',
  CANCELLED: 'bg-red-100 text-red-600',
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrders().then((res) => setOrders(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="max-w-3xl mx-auto px-5 py-16 text-ink/50">Loading orders…</div>

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl text-ink mb-6">Order history</h1>

      {orders.length === 0 ? (
        <div className="bg-white border border-mist rounded-2xl p-10 text-center">
          <p className="text-ink/60 mb-4">You haven't placed any orders yet.</p>
          <Link to="/menu" className="text-clay font-medium">Browse the menu →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white border border-mist rounded-2xl p-5 hover:border-clay transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-lg text-ink">{order.token}</span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || ''}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-ink/60">
                <span>{order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}</span>
                <span>₹{Number(order.totalAmount).toFixed(0)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
