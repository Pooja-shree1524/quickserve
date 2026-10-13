import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { placeOrder, createRazorpayOrder, verifyRazorpayPayment } from '../services/api'

function defaultPickupTime() {
  const d = new Date(Date.now() + 20 * 60 * 1000)
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

/** Load the Razorpay checkout JS once and return the Razorpay constructor */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/* ─────────────────────────────────────────────────────────────
   Payment Success Modal
────────────────────────────────────────────────────────────── */
function PaymentSuccessModal({ order, onViewOrder, onClose }) {
  const token = order.token
  const waitMins = order.estimatedWaitMinutes

  // Compute estimated pickup time from order
  let pickupLabel = null
  if (order.createdAt && waitMins) {
    const d = new Date(order.createdAt)
    d.setMinutes(d.getMinutes() + waitMins)
    pickupLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-300">

        {/* Green header */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-center text-white">
          {/* Animated checkmark circle */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Successful!</h2>
          <p className="text-green-100 text-sm mt-1">Your order has been placed</p>
        </div>

        {/* Token spotlight */}
        <div className="bg-amber-50 border-b border-amber-100 py-5 px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-1">Your Token Number</p>
          <p className="font-mono text-5xl font-black text-slate-900 tracking-wider">{token || '—'}</p>
          <p className="text-xs text-slate-500 mt-1">Show this at the counter</p>
        </div>

        {/* Order details */}
        <div className="px-6 py-4 space-y-2.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span className="font-medium">Order ID</span>
            <span className="text-slate-900 font-semibold">QS{order.id}</span>
          </div>
          {waitMins && (
            <div className="flex justify-between text-slate-600">
              <span className="font-medium">AI Est. Wait</span>
              <span className="text-slatelet-900 font-semibold">{waitMins} min</span>
            </div>
          )}
          {pickupLabel && (
            <div className="flex justify-between text-slate-600">
              <span className="font-medium">Est. Pickup</span>
              <span className="text-slate-900 font-semibold">{pickupLabel}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span className="font-medium">Status</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">PLACED</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={onViewOrder}
            className="w-full bg-slate-900 text-white rounded-full py-3 font-semibold text-sm hover:bg-slate-700 transition-colors"
          >
            View Order & Track Status
          </button>
          <button
            onClick={onClose}
            className="w-full text-slate-500 text-sm py-2 hover:text-slate-800 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Checkout Page
────────────────────────────────────────────────────────────── */
export default function Checkout() {
  const { cart, total, refreshCart } = useCart()
  const navigate = useNavigate()
  const [pickupTime, setPickupTime] = useState(defaultPickupTime())
  const [paymentMethod, setPaymentMethod] = useState('DUMMY')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  // Success popup state
  const [successOrder, setSuccessOrder] = useState(null)

  const items = cart.items || []

  /* Show popup then clear cart */
  const onOrderSuccess = async (order) => {
    await refreshCart()
    setSuccessOrder(order)
    setPlacing(false)
  }

  /* ── DUMMY flow ─────────────────────────────────────────── */
  const handleDummyOrder = async () => {
    setError('')
    setPlacing(true)
    try {
      const res = await placeOrder({
        pickupTime: pickupTime ? new Date(pickupTime).toISOString() : null,
        paymentMethod: 'DUMMY',
      })
      await onOrderSuccess(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place your order. Please try again.')
      setPlacing(false)
    }
  }

  /* ── RAZORPAY flow ──────────────────────────────────────── */
  const handleRazorpayOrder = async () => {
    setError('')
    setPlacing(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        setError('Razorpay failed to load. Check your internet connection.')
        setPlacing(false)
        return
      }

      const rzpData = await createRazorpayOrder(total)

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: rzpData.keyId,
          amount: Math.round(total * 100),
          currency: 'INR',
          name: 'QuickServe',
          description: 'Canteen Order',
          order_id: rzpData.razorpayOrderId,
          prefill: {
            name: JSON.parse(localStorage.getItem('qs_user') || '{}').name || '',
            email: JSON.parse(localStorage.getItem('qs_user') || '{}').email || '',
          },
          theme: { color: '#c1440e' },
          handler: async function (response) {
            try {
              const orderRes = await verifyRazorpayPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                pickupTime: pickupTime ? new Date(pickupTime).toISOString() : null,
              })
              await onOrderSuccess(orderRes.data)
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
        })
        rzp.open()
      })
    } catch (err) {
      if (err.message === 'Payment cancelled') {
        setError('Payment was cancelled. Your order has not been placed.')
      } else {
        setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.')
      }
      setPlacing(false)
    }
  }

  const handlePlaceOrder = () => {
    if (paymentMethod === 'RAZORPAY') handleRazorpayOrder()
    else handleDummyOrder()
  }

  /* ── Empty cart guard ───────────────────────────────────── */
  if (items.length === 0 && !successOrder) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <p className="text-ink/60 mb-4">Your cart is empty.</p>
        <Link to="/menu" className="text-clay font-medium">Browse the menu →</Link>
      </div>
    )
  }

  return (
    <>
      {/* ── SUCCESS POPUP ─────────────────────────────────── */}
      {successOrder && (
        <PaymentSuccessModal
          order={successOrder}
          onViewOrder={() => navigate(`/orders/${successOrder.id}`)}
          onClose={() => navigate('/menu')}
        />
      )}

      {/* ── CHECKOUT FORM ─────────────────────────────────── */}
      <div className="max-w-md mx-auto px-5 py-10">
        <h1 className="font-display text-3xl text-ink mb-6">Checkout</h1>

        {error && (
          <div className="bg-clay/10 text-clay text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}

        {/* Order summary */}
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

        {/* Pickup time */}
        <label className="block mb-5">
          <span className="text-sm font-medium text-ink/80">Pickup time</span>
          <input
            type="datetime-local"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-mist bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-leaf/40"
          />
        </label>

        {/* Payment method */}
        <div className="mb-8">
          <span className="text-sm font-medium text-ink/80 block mb-2">Payment method</span>
          <div className="flex gap-3">
            {['DUMMY', 'RAZORPAY'].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  paymentMethod === method
                    ? 'bg-ink text-cream border-ink'
                    : 'bg-white border-mist text-ink/70'
                }`}
              >
                {method === 'DUMMY' ? 'Test payment' : 'Razorpay'}
              </button>
            ))}
          </div>
          {paymentMethod === 'RAZORPAY' && (
            <p className="text-xs text-ink/50 mt-2 pl-1">
              You will be redirected to Razorpay's secure checkout. Your order is confirmed only after payment succeeds.
            </p>
          )}
        </div>

        {/* Pay button */}
        <button
          onClick={handlePlaceOrder}
          disabled={placing}
          className="w-full bg-clay text-cream rounded-full py-3 font-medium hover:bg-ink transition-colors disabled:opacity-50"
        >
          {placing
            ? (paymentMethod === 'RAZORPAY' ? 'Opening Razorpay…' : 'Placing order…')
            : `Pay ₹${total.toFixed(0)} & place order`}
        </button>
      </div>
    </>
  )
}
