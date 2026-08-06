import { Routes, Route, Link, useLocation } from "react-router-dom";
import CustomerQueue from "./pages/CustomerQueue.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";

export default function App() {
  const location = useLocation();

  return (
    <div>
      <nav className="top-nav">
        <span className="brand">QuickServe</span>
        <div className="nav-links">
          <Link className={location.pathname === "/" ? "active" : ""} to="/">
            Live Queue
          </Link>
          <Link className={location.pathname === "/admin" ? "active" : ""} to="/admin">
            Kitchen Panel
          </Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<CustomerQueue />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </div>
  );
}
