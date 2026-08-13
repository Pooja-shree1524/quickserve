import React from 'react';

const STYLES = {
  PLACED:    'bg-amber-100 text-amber-700 border border-amber-200',
  PENDING:   'bg-amber-100 text-amber-700 border border-amber-200',
  ACCEPTED:  'bg-blue-100 text-blue-700 border border-blue-200',
  PREPARING: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  READY:     'bg-green-100 text-green-700 border border-green-200',
  COLLECTED: 'bg-gray-100 text-gray-600 border border-gray-200',
  REJECTED:  'bg-red-100 text-red-700 border border-red-200',
  CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold font-mono uppercase tracking-wide ${STYLES[status] || 'bg-gray-200 text-gray-700'}`}>
      {status}
    </span>
  );
}
