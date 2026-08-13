import React, { useEffect, useState, useCallback } from 'react'
import { getFoods } from '../services/api'
import { useCart } from '../context/CartContext'

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Beverages']

export default function Menu() {
  const [foods, setFoods] = useState([])
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState(null)
  const { addItem } = useCart()

  const fetchFoods = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      else if (category !== 'All') params.category = category
      const res = await getFoods(params)
      setFoods(res.data)
    } finally {
      setLoading(false)
    }
  }, [category, search])

  useEffect(() => {
    const timer = setTimeout(fetchFoods, 250)
    return () => clearTimeout(timer)
  }, [fetchFoods])

  const handleAdd = async (foodId) => {
    setAddingId(foodId)
    try {
      await addItem(foodId, 1)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl text-ink mb-1">Today's menu</h1>
      <p className="text-ink/60 mb-6">Add what you like, pick a pickup time, and we'll take it from here.</p>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search for a dish…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-mist bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-leaf/40"
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setSearch('') }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === c && !search ? 'bg-ink text-cream' : 'bg-white border border-mist text-ink/70 hover:bg-mist'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-ink/50">Loading menu…</p>
      ) : foods.length === 0 ? (
        <p className="text-ink/50">No dishes match that search.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {foods.map((food) => (
            <div key={food.id} className="bg-white border border-mist rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-display text-lg text-ink">{food.name}</h3>
                <span className="text-clay font-semibold">₹{Number(food.price).toFixed(0)}</span>
              </div>
              <p className="text-sm text-ink/60 mb-4 flex-1">{food.description}</p>
              <div className="flex items-center justify-between text-xs text-ink/40 mb-3">
                <span>{food.category}</span>
                <span>~{food.prepTimeMinutes} min prep</span>
              </div>
              <button
                onClick={() => handleAdd(food.id)}
                disabled={!food.available || addingId === food.id}
                className="w-full bg-leaf text-cream rounded-full py-2 text-sm font-medium hover:bg-ink transition-colors disabled:opacity-40"
              >
                {!food.available ? 'Unavailable' : addingId === food.id ? 'Adding…' : 'Add to cart'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
