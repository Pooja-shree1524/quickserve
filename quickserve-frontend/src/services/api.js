import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qs_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('qs_token')
      localStorage.removeItem('qs_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ---------- Auth ----------
export const registerUser = (data) => api.post('/auth/register', data)
export const loginUser = (data) => api.post('/auth/login', data)

// ---------- Profile ----------
export const getProfile = () => api.get('/users/me')
export const updateProfile = (data) => api.put('/users/me', data)

// ---------- Menu ----------
export const getFoods = (params) => api.get('/foods', { params })
export const getFood = (id) => api.get(`/foods/${id}`)

// ---------- Cart ----------
export const getCart = () => api.get('/cart')
export const addToCart = (data) => api.post('/cart', data)
export const updateCartItem = (cartItemId, quantity) =>
  api.put(`/cart/${cartItemId}`, null, { params: { quantity } })
export const removeCartItem = (cartItemId) => api.delete(`/cart/${cartItemId}`)

// ---------- Orders ----------
export const placeOrder = (data) => api.post('/order', data)
export const getOrders = () => api.get('/orders')
export const getOrder = (id) => api.get(`/orders/${id}`)
export const trackOrder = (id) => api.get(`/track/${id}`)

// ---------- Token & Queue ----------
export const generateToken = (payload) => api.post('/generateToken', payload).then(r => r.data)
export const getQueue = () => api.get('/queue').then(r => r.data)
export const updateStatus = (tokenNumber, status) => api.put('/updateStatus', { tokenNumber, status }).then(r => r.data)
export const getCurrentToken = () => api.get('/currentToken').then(r => r.data)
export const getToken = (tokenNumber) => api.get(`/token/${tokenNumber}`).then(r => r.data)
export const predictCrowd = (params) => api.get('/ai/predictCrowd', { params }).then(r => r.data)

// ---------- Admin (Member 4) ----------
export const getAdminDashboard = () => api.get('/admin/dashboard').then(r => r.data)
export const getAdminAiDashboard = () => api.get('/admin/ai-dashboard').then(r => r.data)
export const getAdminFood = () => api.get('/admin/food').then(r => r.data)
export const addAdminFood = (payload) => api.post('/admin/food', payload).then(r => r.data)
export const updateAdminFood = (id, payload) => api.put(`/admin/food/${id}`, payload).then(r => r.data)
export const deleteAdminFood = (id) => api.delete(`/admin/food/${id}`).then(r => r.data)
export const getAdminOrders = () => api.get('/admin/orders').then(r => r.data)
export const updateAdminOrderStatus = (orderId, status) => api.put('/admin/orders/status', { orderId, status }).then(r => r.data)
export const getAdminUsers = () => api.get('/admin/users').then(r => r.data)
export const blockUser = (id) => api.put(`/admin/users/${id}/block`).then(r => r.data)
export const unblockUser = (id) => api.put(`/admin/users/${id}/unblock`).then(r => r.data)
export const getAdminAnalytics = () => api.get('/admin/analytics').then(r => r.data)

export default api
