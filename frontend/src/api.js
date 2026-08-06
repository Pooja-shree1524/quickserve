// Points at the Spring Boot backend. Override with a .env file
// (VITE_API_BASE_URL=...) if you deploy the backend elsewhere.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || Object.values(data)[0] || "Request failed";
    throw new Error(message);
  }
  return data;
}

export const api = {
  generateToken: (payload) =>
    request("/api/generateToken", { method: "POST", body: JSON.stringify(payload) }),
  getQueue: () => request("/api/queue"),
  updateStatus: (tokenNumber, status) =>
    request("/api/updateStatus", {
      method: "PUT",
      body: JSON.stringify({ tokenNumber, status }),
    }),
  getCurrentToken: () => request("/api/currentToken"),
  getToken: (tokenNumber) => request(`/api/token/${tokenNumber}`),
};
