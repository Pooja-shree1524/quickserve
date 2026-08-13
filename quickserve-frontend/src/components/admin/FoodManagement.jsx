import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { getAdminFood, addAdminFood, updateAdminFood, deleteAdminFood } from '../../services/api.js';

const EMPTY_FORM = {
  name: '', description: '', category: '', price: '', avgPrepTimeMinutes: 10, imageUrl: '', available: true,
};

export default function FoodManagement() {
  const [food, setFood] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      setFood(await getAdminFood());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the menu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name, description: item.description || '', category: item.category,
      price: item.price, avgPrepTimeMinutes: item.prepTimeMinutes || 10, imageUrl: item.imageUrl || '',
      available: item.available,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, price: Number(form.price), avgPrepTimeMinutes: Number(form.avgPrepTimeMinutes) };
      if (editingId) {
        await updateAdminFood(editingId, payload);
      } else {
        await addAdminFood(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save that item. Check the fields and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from the menu?')) return;
    try {
      await deleteAdminFood(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete that item.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Food Management</h1>
          <p className="text-gray-600 text-sm mt-0.5">Add, edit, or remove menu items.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-semibold px-3.5 py-2 rounded-sm"
        >
          <Plus size={16} /> Add Food
        </button>
      </div>

      {error && (
        <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-sm px-3 py-2 mb-5">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-600 text-sm">Loading menu…</p>
      ) : food.length === 0 ? (
        <p className="text-gray-600 text-sm bg-white border border-gray-200 rounded-sm p-6 text-center">
          No food items yet. Add your first one.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {food.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-sm p-4 flex flex-col shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-slate-900 truncate">{item.name}</p>
                  <p className="text-gray-500 text-xs uppercase tracking-wide font-mono mt-0.5">{item.category}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-sm ${item.available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                  {item.available ? 'Available' : 'Off menu'}
                </span>
              </div>
              {item.description && <p className="text-gray-600 text-sm mt-2 line-clamp-2">{item.description}</p>}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div>
                  <p className="font-display font-semibold text-slate-900">₹{Number(item.price).toFixed(2)}</p>
                  <p className="text-gray-500 text-xs">~{item.prepTimeMinutes || 10} min prep</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(item)} className="p-2 rounded-sm border border-gray-200 hover:border-amber-500 hover:text-amber-600 text-gray-600">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 rounded-sm border border-gray-200 hover:border-rose-500 hover:text-rose-600 text-gray-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm w-full max-w-md p-6 relative shadow-xl">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-500 hover:text-slate-900">
              <X size={18} />
            </button>
            <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">
              {editingId ? 'Edit food item' : 'Add food item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm" />
              <textarea placeholder="Description (optional)" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Category" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm" />
                <input required type="number" step="0.01" min="0.01" placeholder="Price" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="1" placeholder="Prep time (min)" value={form.avgPrepTimeMinutes}
                  onChange={(e) => setForm({ ...form, avgPrepTimeMinutes: e.target.value })}
                  className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm" />
                <label className="flex items-center gap-2 text-sm text-gray-600 px-1">
                  <input type="checkbox" checked={form.available}
                    onChange={(e) => setForm({ ...form, available: e.target.checked })} />
                  Available
                </label>
              </div>
              <input placeholder="Image URL (optional)" value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm" />

              <button type="submit" disabled={saving}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-semibold text-sm rounded-sm py-2.5 mt-2">
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add to menu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
