import React, { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { getAnalytics } from '../../api/adminApi';

function ChartCard({ title, children, empty }) {
  return (
    <div className="bg-white border border-steel-200 rounded-sm p-5">
      <h3 className="font-display font-semibold text-ink-950 mb-4">{title}</h3>
      {empty ? (
        <p className="text-steel-600 text-sm py-10 text-center">Not enough data yet.</p>
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
      setData(await getAnalytics());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-steel-600 text-sm">Loading analytics…</p>;

  const ordersPerDay = Object.entries(data?.ordersPerDay || {}).map(([day, count]) => ({ day, count }));
  const peakHours = Object.entries(data?.peakHours || {})
    .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
    .sort((a, b) => Number(a.hour) - Number(b.hour));
  const mostOrdered = (data?.mostOrderedFoods || []).map((f) => ({ name: f.foodName, qty: f.quantitySold }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Analytics</h1>
        <p className="text-steel-600 text-sm mt-0.5">Last 7 days of activity across the canteen.</p>
      </div>

      {error && (
        <p className="text-signal-rejected text-sm bg-signal-rejected/10 border border-signal-rejected/30 rounded-sm px-3 py-2 mb-5">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-ink-950 rounded-sm p-4">
          <p className="text-steel-400 text-xs uppercase tracking-wide">Revenue (7d)</p>
          <p className="font-display text-xl font-semibold text-steel-50 mt-1">
            ₹{Number(data?.revenueLast7Days ?? 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-amber-500 rounded-sm p-4">
          <p className="text-ink-950/70 text-xs uppercase tracking-wide">Avg. Wait Time</p>
          <p className="font-display text-xl font-semibold text-ink-950 mt-1">
            {data?.averageWaitMinutes ?? 0} min
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Orders per Day" empty={ordersPerDay.length === 0}>
          <ResponsiveContainer>
            <LineChart data={ordersPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7EDEE" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#8FA5A9" />
              <YAxis tick={{ fontSize: 11 }} stroke="#8FA5A9" allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#DB9020" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Peak Hours" empty={peakHours.length === 0}>
          <ResponsiveContainer>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7EDEE" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#8FA5A9" />
              <YAxis tick={{ fontSize: 11 }} stroke="#8FA5A9" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3D7EBF" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most Ordered Food" empty={mostOrdered.length === 0}>
          <ResponsiveContainer>
            <BarChart data={mostOrdered} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7EDEE" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#8FA5A9" allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#8FA5A9" width={100} />
              <Tooltip />
              <Bar dataKey="qty" fill="#3E9D5C" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
