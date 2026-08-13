import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeCartItem as apiRemoveCartItem } from '../services/api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState({ items: [] })
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const res = await getCart()
      setCart(res.data)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) refreshCart()
    else setCart({ items: [] })
  }, [isAuthenticated, refreshCart])

  const addItem = useCallback(async (foodId, quantity = 1) => {
    const res = await apiAddToCart({ foodId, quantity })
    setCart(res.data)
  }, [])

  const updateItem = useCallback(async (cartItemId, quantity) => {
    const res = await apiUpdateCartItem(cartItemId, quantity)
    setCart(res.data)
  }, [])

  const removeItem = useCallback(async (cartItemId) => {
    const res = await apiRemoveCartItem(cartItemId)
    setCart(res.data)
  }, [])

  const itemCount = cart.items?.reduce((sum, i) => sum + i.quantity, 0) || 0
  const total = cart.items?.reduce((sum, i) => sum + i.food.price * i.quantity, 0) || 0

  return (
    <CartContext.Provider value={{ cart, loading, refreshCart, addItem, updateItem, removeItem, itemCount, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
