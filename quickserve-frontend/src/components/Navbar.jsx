import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur border-b border-mist">
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl font-semibold text-ink tracking-tight">
          Quick<span className="text-clay">Serve</span>
        </Link>

        {isAuthenticated ? (
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link to="/menu" className="hover:text-clay transition-colors">Menu</Link>
            <Link to="/orders" className="hover:text-clay transition-colors">My orders</Link>
            <Link to="/queue" className="hover:text-clay transition-colors">Live Queue</Link>
            {user?.role === 'ADMIN' && (
              <>
                <Link to="/admin/queue" className="hover:text-clay transition-colors">Kitchen</Link>
                <Link
                  to="/admin/dashboard"
                  className="bg-ink text-cream px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-leaf transition-colors flex items-center gap-1"
                >
                  ⚙ Admin
                </Link>
              </>
            )}
            <Link to="/profile" className="hover:text-clay transition-colors">Profile</Link>
            <Link to="/cart" className="relative flex items-center hover:text-clay transition-colors">
              Cart
              {itemCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-clay text-cream text-xs">
                  {itemCount}
                </span>
              )}
            </Link>
            <span className="text-ink/40">|</span>
            <span className="text-ink/70">Hi, {user?.name?.split(' ')[0]}</span>
            <button onClick={handleLogout} className="text-clay hover:text-ink transition-colors">
              Log out
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link to="/queue" className="hover:text-clay transition-colors">Live Queue</Link>
            <Link to="/login" className="hover:text-clay transition-colors">Log in</Link>
            <Link
              to="/register"
              className="bg-ink text-cream px-4 py-2 rounded-full hover:bg-leaf transition-colors"
            >
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
