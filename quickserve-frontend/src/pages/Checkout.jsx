import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { placeOrder } from '../services/api'

function defaultPickupTime() {
  const d = new Date(Date.now() + 20 * 60 * 1000)
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

export default function Checkout() {
  const { cart, total, refreshCart } = useCart()
  const navigate = useNavigate()
  const [pickupTime, setPickupTime] = useState(defaultPickupTime())
  const [paymentMethod, setPaymentMethod] = useState('DUMMY')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  const items = cart.items || []

  const handlePlaceOrder = async () => {
    setError('')
    setPlacing(true)
    try {
      const res = await placeOrder({
        pickupTime: pickupTime ? new Date(pickupTime).toISOString() : null,
        paymentMethod,
      })
      await refreshCart()
      navigate(`/orders/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place your order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <p className="text-ink/60 mb-4">Your cart is empty.</p>
        <Link to="/menu" className="text-clay font-medium">Browse the menu →</Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      <h1 className="font-display text-3xl text-ink mb-6">Checkout</h1>

      {error && <div className="bg-clay/10 text-clay text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="bg-white border border-mist rounded-2xl p-5 mb-5">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-1">
            <span>{item.food.name} × {item.quantity}</span>
            <span>₹{(item.food.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div className="dashed-divider my-3" />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>₹{total.toFixed(0)}</span>
        </div>
      </div>

      <label className="block mb-5">
        <span className="text-sm font-medium text-ink/80">Pickup time</span>
        <input
          type="datetime-local"
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
          className="mt-1 w-full rounded-lg border border-mist bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-leaf/40"
        />
      </label>

      <div className="mb-8">
        <span className="text-sm font-medium text-ink/80 block mb-2">Payment method</span>
        <div className="flex gap-3">
          {['DUMMY', 'RAZORPAY'].map((method) => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                paymentMethod === method ? 'bg-ink text-cream border-ink' : 'bg-white border-mist text-ink/70'
              }`}
            >
              {method === 'DUMMY' ? 'Test payment' : 'Razorpay'}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={placing}
        className="w-full bg-clay text-cream rounded-full py-3 font-medium hover:bg-ink transition-colors disabled:opacity-50"
      >
        {placing ? 'Placing order…' : `Pay ₹${total.toFixed(0)} & place order`}
      </button>
    </div>
  )
}
