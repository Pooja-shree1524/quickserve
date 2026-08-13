import React, { useEffect, useState, useCallback } from 'react';
import { Users, TrendingUp, Timer, Gauge } from 'lucide-react';
import { getAiDashboard } from '../../api/adminApi';

const LOAD_STYLES = {
  LIGHT: 'bg-signal-ready/15 text-signal-ready',
  NORMAL: 'bg-signal-preparing/15 text-signal-preparing',
  BUSY: 'bg-signal-waiting/15 text-signal-waiting',
  OVERLOADED: 'bg-signal-rejected/15 text-signal-rejected',
};

const CROWD_STYLES = {
  LOW: 'bg-signal-ready/15 text-signal-ready',
  MODERATE: 'bg-signal-waiting/15 text-signal-waiting',
  HIGH: 'bg-signal-rejected/15 text-signal-rejected',
};

export default function AIDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await getAiDashboard());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load AI predictions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <p className="text-steel-600 text-sm">Loading AI predictions…</p>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-950">AI Dashboard</h1>
        <p className="text-steel-600 text-sm mt-0.5">
          Crowd and kitchen-load predictions driving intelligent token allocation.
        </p>
      </div>

      {error && (
        <p className="text-signal-rejected text-sm bg-signal-rejected/10 border border-signal-rejected/30 rounded-sm px-3 py-2 mb-5">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-steel-200 rounded-sm p-5">
          <div className="flex items-center gap-2 text-steel-600 text-xs uppercase tracking-wide mb-3">
            <Users size={15} /> Current Crowd
          </div>
          <p className="font-display text-3xl font-semibold text-ink-950">{data?.currentCrowd ?? 0}</p>
          <p className="text-steel-600 text-sm mt-1">people in the active queue right now</p>
        </div>

        <div className="bg-white border border-steel-200 rounded-sm p-5">
          <div className="flex items-center gap-2 text-steel-600 text-xs uppercase tracking-wide mb-3">
            <TrendingUp size={15} /> Predicted Crowd
          </div>
          <span className={`inline-block font-display text-lg font-semibold px-3 py-1 rounded-sm ${CROWD_STYLES[data?.predictedCrowdLevel] || 'bg-steel-200 text-steel-600'}`}>
            {data?.predictedCrowdLevel ?? '—'}
          </span>
          <p className="text-steel-600 text-sm mt-2">based on this hour's historical pattern</p>
        </div>

        <div className="bg-white border border-steel-200 rounded-sm p-5">
          <div className="flex items-center gap-2 text-steel-600 text-xs uppercase tracking-wide mb-3">
            <Timer size={15} /> Average Waiting Time
          </div>
          <p className="font-display text-3xl font-semibold text-ink-950">
            {data?.averageWaitingTimeMinutes ?? 0} <span className="text-lg text-steel-600">min</span>
          </p>
          <p className="text-steel-600 text-sm mt-1">across orders currently in the kitchen</p>
        </div>

        <div className="bg-white border border-steel-200 rounded-sm p-5">
          <div className="flex items-center gap-2 text-steel-600 text-xs uppercase tracking-wide mb-3">
            <Gauge size={15} /> Kitchen Load
          </div>
          <span className={`inline-block font-display text-lg font-semibold px-3 py-1 rounded-sm ${LOAD_STYLES[data?.kitchenLoad] || 'bg-steel-200 text-steel-600'}`}>
            {data?.kitchenLoad ?? '—'}
          </span>
          <p className="text-steel-600 text-sm mt-2">{data?.activeKitchenOrders ?? 0} orders accepted or preparing</p>
        </div>
      </div>
    </div>
  );
}
