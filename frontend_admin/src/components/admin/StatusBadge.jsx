import React from 'react';

const STYLES = {
  PENDING: 'bg-signal-waiting/15 text-signal-waiting',
  ACCEPTED: 'bg-signal-waiting/15 text-signal-waiting',
  PREPARING: 'bg-signal-preparing/15 text-signal-preparing',
  READY: 'bg-signal-ready/15 text-signal-ready',
  COLLECTED: 'bg-signal-collected/15 text-signal-collected',
  REJECTED: 'bg-signal-rejected/15 text-signal-rejected',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold font-mono uppercase tracking-wide ${STYLES[status] || 'bg-steel-200 text-steel-600'}`}>
      {status}
    </span>
  );
}
