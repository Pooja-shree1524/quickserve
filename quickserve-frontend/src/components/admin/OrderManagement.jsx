import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { getAdminOrders } from '../../services/api.js';
import StatusBadge from './StatusBadge';

const FILTERS = ['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED', 'CANCELLED'];

function formatPickupTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const visible = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Order History</h1>
          <p className="text-gray-600 text-sm mt-0.5">Full history of all orders with AI timing and payment status.</p>
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
        <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto shadow-sm">
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
                  <th className="text-left font-medium px-4 py-2.5">Payment</th>
                  <th className="text-left font-medium px-4 py-2.5">AI Wait</th>
                  <th className="text-left font-medium px-4 py-2.5">Est. Pickup</th>
                  <th className="text-left font-medium px-4 py-2.5">Placed At</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{o.tokenNumber}</td>
                    <td className="px-4 py-3 text-slate-900">{o.customerName}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{o.items?.join(', ')}</td>
                    <td className="px-4 py-3 text-slate-900">₹{Number(o.totalAmount).toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        o.paymentStatus === 'SUCCESS'     ? 'bg-green-100 text-green-700' :
                        o.paymentStatus === 'FAILED'      ? 'bg-red-100 text-red-700'    :
                        o.paymentStatus === 'PENDING'     ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-600'
                      }`}>
                        {o.paymentStatus || 'DUMMY'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {o.estimatedWaitMinutes ? `${o.estimatedWaitMinutes} min` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {formatPickupTime(o.estimatedPickupTime)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDateTime(o.createdAt)}
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
