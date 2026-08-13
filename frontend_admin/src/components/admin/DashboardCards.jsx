import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList, IndianRupee, Clock, Flame, CheckCircle2, PackageCheck, RefreshCw,
} from 'lucide-react';
import { getDashboard, updateOrderStatus } from '../../api/adminApi';
import StatusBadge from './StatusBadge';

const CARD_DEFS = [
  { key: 'todaysOrders', label: "Today's Orders", icon: ClipboardList, format: (v) => v ?? 0 },
  { key: 'todaysRevenue', label: 'Revenue', icon: IndianRupee, format: (v) => `₹${Number(v ?? 0).toFixed(2)}` },
  { key: 'waitingOrders', label: 'Waiting Orders', icon: Clock, accent: 'text-signal-waiting' },
  { key: 'preparingOrders', label: 'Preparing', icon: Flame, accent: 'text-signal-preparing' },
  { key: 'readyOrders', label: 'Ready', icon: CheckCircle2, accent: 'text-signal-ready' },
  { key: 'collectedOrders', label: 'Collected', icon: PackageCheck, accent: 'text-signal-collected' },
];

const NEXT_ACTIONS = {
  PENDING: [{ label: 'Accept', status: 'ACCEPTED' }, { label: 'Reject', status: 'REJECTED' }],
  ACCEPTED: [{ label: 'Start Preparing', status: 'PREPARING' }],
  PREPARING: [{ label: 'Mark Ready', status: 'READY' }],
  READY: [{ label: 'Mark Collected', status: 'COLLECTED' }],
};

export default function DashboardCards() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await getDashboard();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const handleAction = async (orderId, status) => {
    setBusyId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update that order.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-steel-600 text-sm">Loading dashboard…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">Dashboard</h1>
          <p className="text-steel-600 text-sm mt-0.5">Live kitchen overview, refreshes every 15s.</p>
        </div>
        <button onClick={load} className="focus-ring flex items-center gap-2 text-sm text-steel-600 hover:text-ink-950 px-3 py-2 rounded-sm border border-steel-200 bg-white">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <p className="text-signal-rejected text-sm bg-signal-rejected/10 border border-signal-rejected/30 rounded-sm px-3 py-2 mb-5">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {CARD_DEFS.map(({ key, label, icon: Icon, format, accent }) => (
          <div key={key} className="bg-white border border-steel-200 rounded-sm p-4">
            <Icon size={18} className={accent || 'text-steel-600'} />
            <p className="font-display text-2xl font-semibold text-ink-950 mt-2">
              {format ? format(data?.[key]) : data?.[key] ?? 0}
            </p>
            <p className="text-steel-600 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display text-lg font-semibold text-ink-950 mb-3">Active queue</h2>
      <div className="bg-white border border-steel-200 rounded-sm overflow-hidden">
        {(!data?.orders || data.orders.length === 0) ? (
          <p className="text-steel-600 text-sm p-6 text-center">No active orders right now.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-steel-100 text-steel-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Token</th>
                <th className="text-left font-medium px-4 py-2.5">Customer</th>
                <th className="text-left font-medium px-4 py-2.5">Items</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
                <th className="text-left font-medium px-4 py-2.5">ETA</th>
                <th className="text-right font-medium px-4 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.id} className="border-t border-steel-100">
                  <td className="px-4 py-3 font-mono font-semibold text-ink-950">{o.tokenNumber}</td>
                  <td className="px-4 py-3 text-ink-950">{o.customerName}</td>
                  <td className="px-4 py-3 text-steel-600">{o.items?.join(', ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-steel-600">
                    {o.estimatedWaitMinutes ? `${o.estimatedWaitMinutes} min` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {(NEXT_ACTIONS[o.status] || []).map((a) => (
                      <button
                        key={a.status}
                        disabled={busyId === o.id}
                        onClick={() => handleAction(o.id, a.status)}
                        className="focus-ring text-xs font-semibold px-2.5 py-1.5 rounded-sm border border-steel-200 hover:border-amber-500 hover:text-amber-600 disabled:opacity-50 text-ink-950"
                      >
                        {a.label}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
