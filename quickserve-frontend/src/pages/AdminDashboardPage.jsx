import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardCards from '../components/admin/DashboardCards';
import FoodManagement from '../components/admin/FoodManagement';
import OrderManagement from '../components/admin/OrderManagement';
import UserManagement from '../components/admin/UserManagement';
import Analytics from '../components/admin/Analytics';
import AIDashboard from '../components/admin/AIDashboard';

const SECTIONS = {
  dashboard: DashboardCards,
  food: FoodManagement,
  orders: OrderManagement,
  users: UserManagement,
  analytics: Analytics,
  ai: AIDashboard,
};

export default function AdminDashboardPage() {
  const [active, setActive] = useState('dashboard');
  const Section = SECTIONS[active] || DashboardCards;

  return (
    <AdminLayout active={active} onNavigate={setActive}>
      <Section />
    </AdminLayout>
  );
}
