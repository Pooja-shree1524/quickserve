import React from 'react';
import {
  LayoutGrid, UtensilsCrossed, ClipboardList, Users, BarChart3,
  Brain, LogOut, ChefHat, Tv, ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { key: 'kitchen', label: 'Kitchen & Tokens', icon: ChefHat },
  { key: 'orders', label: 'Order Management', icon: ClipboardList },
  { key: 'food', label: 'Food Management', icon: UtensilsCrossed },
  { key: 'users', label: 'User Management', icon: Users },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'ai', label: 'AI Dashboard', icon: Brain },
];

export default function AdminLayout({ active, onNavigate, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      <aside className="w-60 shrink-0 bg-slate-900 flex flex-col">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-800">
          <div className="w-8 h-8 rounded-sm bg-amber-500 flex items-center justify-center shrink-0">
            <UtensilsCrossed size={16} className="text-slate-900" />
          </div>
          <span className="font-display font-semibold text-slate-50 tracking-tight">QuickServe Admin</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-slate-900 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-50'
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            to="/queue"
            target="_blank"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-colors"
          >
            <Tv size={15} />
            Open Live Queue Display ↗
          </Link>
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Website
          </Link>
        </div>

        <div className="p-3 border-t border-slate-800">
          <div className="px-3 py-2 mb-1">
            <p className="text-slate-50 text-sm font-medium truncate">{user?.name || 'Admin User'}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email || 'admin@quickserve.com'}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
