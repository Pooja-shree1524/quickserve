import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { cart, updateItem, removeItem, total, loading } = useCart()
  const [busyId, setBusyId] = useState(null)
  const navigate = useNavigate()

  const changeQty = async (item, delta) => {
    setBusyId(item.id)
    try {
      await updateItem(item.id, item.quantity + delta)
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (item) => {
    setBusyId(item.id)
    try {
      await removeItem(item.id)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-5 py-16 text-ink/50">Loading cart…</div>

  const items = cart.items || []

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl text-ink mb-6">Your cart</h1>

      {items.length === 0 ? (
        <div className="bg-white border border-mist rounded-2xl p-10 text-center">
          <p className="text-ink/60 mb-4">Your cart is empty.</p>
          <Link to="/menu" className="text-clay font-medium">Browse the menu →</Link>
        </div>
      ) : (
        <>
          <div className="bg-white border border-mist rounded-2xl divide-y divide-mist">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-5">
                <div>
                  <h3 className="font-medium text-ink">{item.food.name}</h3>
                  <p className="text-sm text-ink/50">₹{Number(item.food.price).toFixed(0)} each</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-mist rounded-full">
                    <button
                      onClick={() => changeQty(item, -1)}
                      disabled={busyId === item.id}
                      className="w-8 h-8 flex items-center justify-center text-ink/70 hover:text-clay disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => changeQty(item, 1)}
                      disabled={busyId === item.id}
                      className="w-8 h-8 flex items-center justify-center text-ink/70 hover:text-clay disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-16 text-right font-medium">
                    ₹{(item.food.price * item.quantity).toFixed(0)}
                  </span>
                  <button
                    onClick={() => handleRemove(item)}
                    disabled={busyId === item.id}
                    className="text-ink/40 hover:text-clay text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 mb-8">
            <span className="text-ink/60">Total</span>
            <span className="font-display text-2xl text-ink">₹{total.toFixed(0)}</span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-ink text-cream rounded-full py-3 font-medium hover:bg-leaf transition-colors"
          >
            Proceed to checkout
          </button>
        </>
      )}
    </div>
  )
}
