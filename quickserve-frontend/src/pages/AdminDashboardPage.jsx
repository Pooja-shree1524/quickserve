import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardCards from '../components/admin/DashboardCards';
import FoodManagement from '../components/admin/FoodManagement';
import OrderManagement from '../components/admin/OrderManagement';
import UserManagement from '../components/admin/UserManagement';
import Analytics from '../components/admin/Analytics';
import AIDashboard from '../components/admin/AIDashboard';
import KitchenPanel from './AdminPanel';
import PickupVerification from '../components/admin/PickupVerification';

const SECTIONS = {
  dashboard: DashboardCards,
  kitchen: KitchenPanel,
  orders: OrderManagement,
  food: FoodManagement,
  users: UserManagement,
  analytics: Analytics,
  ai: AIDashboard,
  pickup: PickupVerification,
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
