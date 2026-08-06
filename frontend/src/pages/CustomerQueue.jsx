import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import "./CustomerQueue.css";

const STEPS = ["Waiting", "Preparing", "Ready", "Collected"];

export default function CustomerQueue() {
  const [current, setCurrent] = useState({ currentToken: null, currentStatus: null, next: [] });
  const [tokenInput, setTokenInput] = useState("");
  const [trackedToken, setTrackedToken] = useState(null);
  const [trackedStatus, setTrackedStatus] = useState(null);
  const [error, setError] = useState("");
  const lastStatusRef = useRef(null);

  useEffect(() => {
    const refreshBoard = () => {
      api.getCurrentToken().then(setCurrent).catch(() => {});
    };
    refreshBoard();
    const id = setInterval(refreshBoard, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!trackedToken) return;
    const refreshTracked = () => {
      api
        .getToken(trackedToken)
        .then((data) => {
          setError("");
          setTrackedStatus(data.status);
          if (data.status === "Ready" && lastStatusRef.current !== "Ready") {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("QuickServe", {
                body: `Token ${data.tokenNumber} is ready — collect within 10 mins!`,
              });
            }
          }
          lastStatusRef.current = data.status;
        })
        .catch((e) => setError(e.message));
    };
    refreshTracked();
    const id = setInterval(refreshTracked, 3000);
    return () => clearInterval(id);
  }, [trackedToken]);

  const handleTrack = () => {
    const val = tokenInput.trim().toUpperCase();
    if (!val) return;
    lastStatusRef.current = null;
    setTrackedStatus(null);
    setTrackedToken(val);
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const activeIndex = STEPS.indexOf(trackedStatus);

  return (
    <div className="cq-wrap">
      <div className="cq-eyebrow">QuickServe</div>
      <h1>Live Queue Display</h1>

      <div className="cq-board">
        <div className="cq-board-label">Now Serving</div>
        <div className="cq-now-serving">{current.currentToken || "— — —"}</div>
        <div className="cq-status-pill">
          {current.currentStatus ? `Status: ${current.currentStatus}` : "Waiting for orders..."}
        </div>
        <div className="cq-up-next">
          <div className="cq-up-next-label">Up Next</div>
          {current.next && current.next.length ? (
            current.next.map((t) => (
              <span className="cq-chip" key={t}>
                {t}
              </span>
            ))
          ) : (
            <span className="cq-empty">No orders waiting</span>
          )}
        </div>
      </div>

      <div className="cq-track-card">
        <h2>Track your order</h2>
        <div className="cq-track-row">
          <input
            placeholder="e.g. A101"
            maxLength={6}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
          />
          <button onClick={handleTrack}>Track</button>
        </div>

        <div className="cq-steps">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`cq-step ${i === activeIndex ? "active" : ""} ${
                i < activeIndex ? "done" : ""
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {trackedStatus === "Ready" && (
          <div className="cq-banner show">🔔 Your order is ready — collect within 10 mins</div>
        )}
        {error && <div className="cq-error">{error}</div>}
      </div>

      <div className="cq-footer-note">QuickServe · Smart Token &amp; Queue Module</div>
    </div>
  );
}
