import React, { useEffect, useState, useCallback } from 'react';
import { getAllUsers, blockUser, unblockUser } from '../../api/adminApi';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError('');
      setUsers(await getAllUsers());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleBlock = async (user) => {
    setBusyId(user.id);
    try {
      if (user.blocked) await unblockUser(user.id);
      else await blockUser(user.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update that user.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-950">User Management</h1>
        <p className="text-steel-600 text-sm mt-0.5">View customers and block accounts if needed.</p>
      </div>

      {error && (
        <p className="text-signal-rejected text-sm bg-signal-rejected/10 border border-signal-rejected/30 rounded-sm px-3 py-2 mb-5">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-steel-600 text-sm">Loading users…</p>
      ) : (
        <div className="bg-white border border-steel-200 rounded-sm overflow-hidden">
          {users.length === 0 ? (
            <p className="text-steel-600 text-sm p-6 text-center">No customers registered yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-steel-100 text-steel-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-4 py-2.5">Name</th>
                  <th className="text-left font-medium px-4 py-2.5">Email</th>
                  <th className="text-left font-medium px-4 py-2.5">Joined</th>
                  <th className="text-left font-medium px-4 py-2.5">Status</th>
                  <th className="text-right font-medium px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-steel-100">
                    <td className="px-4 py-3 text-ink-950 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-steel-600">{u.email}</td>
                    <td className="px-4 py-3 text-steel-600">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${u.blocked ? 'bg-signal-rejected/15 text-signal-rejected' : 'bg-signal-ready/15 text-signal-ready'}`}>
                        {u.blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={busyId === u.id}
                        onClick={() => toggleBlock(u)}
                        className={`focus-ring text-xs font-semibold px-2.5 py-1.5 rounded-sm border disabled:opacity-50 ${
                          u.blocked
                            ? 'border-signal-ready/40 text-signal-ready hover:bg-signal-ready/10'
                            : 'border-signal-rejected/40 text-signal-rejected hover:bg-signal-rejected/10'
                        }`}
                      >
                        {u.blocked ? 'Unblock' : 'Block'}
                      </button>
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
