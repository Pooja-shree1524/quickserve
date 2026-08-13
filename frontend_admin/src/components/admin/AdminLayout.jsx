import React from 'react';
import {
  LayoutGrid, UtensilsCrossed, ClipboardList, Users, BarChart3,
  Brain, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { key: 'food', label: 'Food Management', icon: UtensilsCrossed },
  { key: 'orders', label: 'Order Management', icon: ClipboardList },
  { key: 'users', label: 'User Management', icon: Users },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'ai', label: 'AI Dashboard', icon: Brain },
];

export default function AdminLayout({ active, onNavigate, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-steel-50 font-body flex">
      <aside className="w-60 shrink-0 bg-ink-950 flex flex-col">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-ink-800">
          <div className="w-8 h-8 rounded-sm bg-amber-500 flex items-center justify-center shrink-0">
            <UtensilsCrossed size={16} className="text-ink-950" />
          </div>
          <span className="font-display font-semibold text-steel-50 tracking-tight">QuickServe</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                className={`focus-ring w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-ink-950'
                    : 'text-steel-400 hover:bg-ink-900 hover:text-steel-50'
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-ink-800">
          <div className="px-3 py-2 mb-1">
            <p className="text-steel-50 text-sm font-medium truncate">{user?.name}</p>
            <p className="text-steel-600 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="focus-ring w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-steel-400 hover:bg-ink-900 hover:text-signal-rejected transition-colors"
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
