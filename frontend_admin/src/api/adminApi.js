import client from './client';

// ---- Auth ----
export const login = (email, password) =>
  client.post('/api/auth/login', { email, password }).then((r) => r.data);

// ---- Dashboard (GET /dashboard) ----
export const getDashboard = () =>
  client.get('/api/admin/dashboard').then((r) => r.data);

export const getAiDashboard = () =>
  client.get('/api/admin/ai-dashboard').then((r) => r.data);

// ---- Food CRUD (POST/PUT/DELETE /food) ----
export const getAllFood = () =>
  client.get('/api/admin/food').then((r) => r.data);

export const addFood = (payload) =>
  client.post('/api/admin/food', payload).then((r) => r.data);

export const updateFood = (id, payload) =>
  client.put(`/api/admin/food/${id}`, payload).then((r) => r.data);

export const deleteFood = (id) =>
  client.delete(`/api/admin/food/${id}`).then((r) => r.data);

// ---- Order Management (GET orders, PUT /orderStatus) ----
export const getAllOrders = () =>
  client.get('/api/admin/orders').then((r) => r.data);

export const updateOrderStatus = (orderId, status) =>
  client.put('/api/admin/orders/status', { orderId, status }).then((r) => r.data);

// ---- User Management ----
export const getAllUsers = () =>
  client.get('/api/admin/users').then((r) => r.data);

export const blockUser = (id) =>
  client.put(`/api/admin/users/${id}/block`).then((r) => r.data);

export const unblockUser = (id) =>
  client.put(`/api/admin/users/${id}/unblock`).then((r) => r.data);

// ---- Analytics (GET /analytics) ----
export const getAnalytics = () =>
  client.get('/api/admin/analytics').then((r) => r.data);
