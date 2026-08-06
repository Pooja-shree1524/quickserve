import { useEffect, useState } from "react";
import { api } from "../api.js";
import "./AdminPanel.css";

const NEXT_STATUS = { Waiting: "Preparing", Preparing: "Ready", Ready: "Collected", Collected: null };
const ACTION_LABEL = {
  Waiting: "Start preparing",
  Preparing: "Mark ready",
  Ready: "Mark collected",
  Collected: "Done",
};

function emptyItem() {
  return { name: "", complexity: 2 };
}

export default function AdminPanel() {
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [genResult, setGenResult] = useState(null); // { ok: bool, message: string }
  const [queue, setQueue] = useState({ kitchenLoad: 0, preparing: [], waiting: [] });

  useEffect(() => {
    loadQueue();
    const id = setInterval(loadQueue, 4000);
    return () => clearInterval(id);
  }, []);

  function loadQueue() {
    api.getQueue().then(setQueue).catch(() => {});
  }

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanItems = items
      .map((it) => ({ name: it.name.trim(), complexity: Number(it.complexity) }))
      .filter((it) => it.name);

    if (!customerName.trim() || cleanItems.length === 0) {
      setGenResult({ ok: false, message: "Add a customer name and at least one item." });
      return;
    }

    try {
      const data = await api.generateToken({ customerName: customerName.trim(), items: cleanItems });
      setGenResult({
        ok: true,
        message: `Generated ${data.tokenNumber} — est. ${data.estimatedPrepTime} min`,
      });
      setCustomerName("");
      setItems([emptyItem()]);
      loadQueue();
    } catch (err) {
      setGenResult({ ok: false, message: err.message || "Failed to generate token." });
    }
  }

  async function advanceStatus(tokenNumber, currentStatus) {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    try {
      await api.updateStatus(tokenNumber, next);
      loadQueue();
    } catch (err) {
      alert(err.message);
    }
  }

  const rows = [...queue.preparing, ...queue.waiting];

  return (
    <div className="ap-wrap">
      <header className="ap-header">
        <h1>QuickServe — Kitchen Panel</h1>
        <div className="ap-load-badge">
          Kitchen load: <strong>{queue.kitchenLoad}</strong> active orders
        </div>
      </header>

      <div className="ap-grid">
        <div className="ap-card">
          <h2>Generate Token</h2>
          <form onSubmit={handleSubmit}>
            <label>Customer name</label>
            <input
              type="text"
              placeholder="e.g. Priya"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />

            <label>Order items</label>
            {items.map((item, i) => (
              <div className="ap-item-row" key={i}>
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => updateItem(i, "name", e.target.value)}
                />
                <select value={item.complexity} onChange={(e) => updateItem(i, "complexity", e.target.value)}>
                  <option value={1}>Simple</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Complex</option>
                </select>
                <button type="button" onClick={() => removeItem(i)} title="Remove">
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="ap-add-item" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
              + Add item
            </button>

            <button type="submit" className="ap-submit-btn">
              Generate token
            </button>

            {genResult && (
              <div className={`ap-result ${genResult.ok ? "ok" : "err"}`}>{genResult.message}</div>
            )}
          </form>
        </div>

        <div className="ap-card">
          <h2>Live Queue</h2>
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Customer</th>
                <th>Prep</th>
                <th>Complexity</th>
                <th>Status</th>
                <th>Position</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="ap-empty-row">
                  <td colSpan={7}>No active orders yet.</td>
                </tr>
              ) : (
                rows.map((t) => (
                  <tr key={t.tokenNumber}>
                    <td className="ap-token">{t.tokenNumber}</td>
                    <td>{t.customerName}</td>
                    <td>{t.estimatedPrepTime} min</td>
                    <td>{t.totalComplexity}</td>
                    <td>
                      <span className={`ap-badge ${t.status}`}>{t.status}</span>
                    </td>
                    <td>{t.queuePosition ?? "—"}</td>
                    <td>
                      <button
                        disabled={!NEXT_STATUS[t.status]}
                        onClick={() => advanceStatus(t.tokenNumber, t.status)}
                      >
                        {ACTION_LABEL[t.status]}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
