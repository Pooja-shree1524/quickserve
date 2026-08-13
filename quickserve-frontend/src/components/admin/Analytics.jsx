import React, { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { getAdminAnalytics } from '../../services/api.js';

function ChartCard({ title, children, empty }) {
  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5 shadow-sm">
      <h3 className="font-display font-semibold text-slate-900 mb-4">{title}</h3>
      {empty ? (
        <p className="text-gray-600 text-sm py-10 text-center">Not enough data yet.</p>
      ) : (
        <div style={{ width: '100%', height: 260 }}>{children}</div>
      )}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await getAdminAnalytics());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-gray-600 text-sm">Loading analytics…</p>;

  const ordersPerDay = Object.entries(data?.ordersPerDay || {}).map(([day, count]) => ({ day, count }));
  const peakHours = Object.entries(data?.peakHours || {})
    .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
    .sort((a, b) => Number(a.hour) - Number(b.hour));
  const mostOrdered = (data?.mostOrderedFoods || []).map((f) => ({ name: f.foodName, qty: f.quantitySold }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-gray-600 text-sm mt-0.5">Last 7 days of activity across the canteen.</p>
      </div>

      {error && (
        <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-sm px-3 py-2 mb-5">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-900 rounded-sm p-4 text-white shadow-sm">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Revenue (7d)</p>
          <p className="font-display text-xl font-semibold text-slate-50 mt-1">
            ₹{Number(data?.revenueLast7Days ?? 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-amber-500 rounded-sm p-4 text-slate-900 shadow-sm">
          <p className="text-slate-900/70 text-xs uppercase tracking-wide">Avg. Wait Time</p>
          <p className="font-display text-xl font-semibold text-slate-900 mt-1">
            {data?.averageWaitMinutes ?? 0} min
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Orders per Day" empty={ordersPerDay.length === 0}>
          <ResponsiveContainer>
            <LineChart data={ordersPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#64748B" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748B" allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Peak Hours" empty={peakHours.length === 0}>
          <ResponsiveContainer>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#64748B" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748B" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most Ordered Food" empty={mostOrdered.length === 0}>
          <ResponsiveContainer>
            <BarChart data={mostOrdered} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#64748B" allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#64748B" width={100} />
              <Tooltip />
              <Bar dataKey="qty" fill="#10B981" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
