import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { getAdminOrders, updateAdminOrderStatus } from '../../services/api.js';
import StatusBadge from './StatusBadge';

const FILTERS = ['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED', 'CANCELLED'];

const NEXT_ACTIONS = {
  PLACED: [{ label: 'Accept', status: 'ACCEPTED' }, { label: 'Cancel', status: 'CANCELLED' }],
  ACCEPTED: [{ label: 'Start Preparing', status: 'PREPARING' }],
  PREPARING: [{ label: 'Mark Ready', status: 'READY' }],
  READY: [{ label: 'Mark Collected', status: 'COLLECTED' }],
};

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError('');
      setOrders(await getAdminOrders());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (orderId, status) => {
    setBusyId(orderId);
    try {
      await updateAdminOrderStatus(orderId, status);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update that order.');
    } finally {
      setBusyId(null);
    }
  };

  const visible = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Order Management</h1>
          <p className="text-gray-600 text-sm mt-0.5">Accept, reject, and move orders through the kitchen.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-600 hover:text-slate-900 px-3 py-2 rounded-sm border border-gray-200 bg-white">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-sm border ${
              filter === f ? 'bg-slate-900 text-slate-50 border-slate-900' : 'border-gray-200 text-gray-600 bg-white hover:border-slate-900'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-sm px-3 py-2 mb-5">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-600 text-sm">Loading orders…</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
          {visible.length === 0 ? (
            <p className="text-gray-600 text-sm p-6 text-center">No orders match this filter.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-4 py-2.5">Token</th>
                  <th className="text-left font-medium px-4 py-2.5">Customer</th>
                  <th className="text-left font-medium px-4 py-2.5">Items</th>
                  <th className="text-left font-medium px-4 py-2.5">Total</th>
                  <th className="text-left font-medium px-4 py-2.5">Status</th>
                  <th className="text-left font-medium px-4 py-2.5">ETA</th>
                  <th className="text-right font-medium px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{o.tokenNumber}</td>
                    <td className="px-4 py-3 text-slate-900">{o.customerName}</td>
                    <td className="px-4 py-3 text-gray-600">{o.items?.join(', ')}</td>
                    <td className="px-4 py-3 text-slate-900">₹{Number(o.totalAmount).toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{o.estimatedWaitMinutes ? `${o.estimatedWaitMinutes} min` : '—'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {(NEXT_ACTIONS[o.status] || []).map((a) => (
                        <button
                          key={a.status}
                          disabled={busyId === o.id}
                          onClick={() => handleAction(o.id, a.status)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-sm border border-gray-200 hover:border-amber-500 hover:text-amber-600 disabled:opacity-50 text-slate-900"
                        >
                          {a.label}
                        </button>
                      ))}
                      {!(NEXT_ACTIONS[o.status]?.length) && <span className="text-gray-400 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
