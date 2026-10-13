import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Menu from './pages/Menu'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderTracking from './pages/OrderTracking'
import Profile from './pages/Profile'
import CustomerQueue from './pages/CustomerQueue'
import AdminPanel from './pages/AdminPanel'
import AdminDashboardPage from './pages/AdminDashboardPage'
import VerifyEmail from './pages/VerifyEmail'

function CustomerShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/queue" element={<CustomerQueue />} />
          <Route path="/admin/queue" element={<AdminPanel />} />
        </Routes>
      </main>
      <footer className="border-t border-mist py-6 text-center text-xs text-ink/50">
        QuickServe &mdash; skip the line, not the meal.
      </footer>
    </div>
  )
}

function AdminShell() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardPage />
    </AdminProtectedRoute>
  )
}

export default function App() {
  const location = useLocation()

  // Pages that render their own full-screen layout (no Navbar / footer)
  const isFullscreen = (
    location.pathname.startsWith('/admin/dashboard') ||
    location.pathname === '/admin/queue' ||
    location.pathname === '/queue'
  )

  if (isFullscreen) {
    // Admin dashboard needs role protection; queue/kitchen are open
    if (location.pathname.startsWith('/admin/dashboard')) {
      return <AdminShell />
    }
    // Kitchen and Live Queue: render the page directly (their own header)
    return (
      <Routes>
        <Route path="/admin/queue" element={<AdminPanel />} />
        <Route path="/queue"       element={<CustomerQueue />} />
      </Routes>
    )
  }

  return <CustomerShell />
}
