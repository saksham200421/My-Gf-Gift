const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  ""
);

async function apiRequest(path, options = {}) {
  const { token, body, ...restOptions } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(restOptions.headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export async function fetchHealth() {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) {
    throw new Error("Health check failed");
  }
  return response.json();
}

export function buildValentineUrl(token) {
  if (!token) {
    return `${API_URL}/valentine`;
  }
  return `${API_URL}/valentine?token=${encodeURIComponent(token)}`;
}

export async function registerUser({ name, email, password }) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
}

export async function loginUser({ username, password }) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: { username, password },
  });
}

export async function fetchMe(token) {
  return apiRequest("/api/auth/me", {
    method: "GET",
    token,
  });
}

export async function fetchLetters(token) {
  return apiRequest("/api/letters", {
    method: "GET",
    token,
  });
}

export async function createLetter(token, letter) {
  return apiRequest("/api/letters", {
    method: "POST",
    token,
    body: letter,
  });
}

export async function fetchDashboard(token) {
  return apiRequest("/api/dashboard", {
    method: "GET",
    token,
  });
}

export async function updateDashboardFields(token, fields) {
  return apiRequest("/api/dashboard", {
    method: "PATCH",
    token,
    body: fields,
  });
}

export async function toggleDashboardDate(token, dateKey) {
  return apiRequest("/api/dashboard/highlighted-dates", {
    method: "PATCH",
    token,
    body: { dateKey },
  });
}

export async function upsertDashboardOccasion(token, dateKey, text) {
  return apiRequest("/api/dashboard/special-occasion", {
    method: "POST",
    token,
    body: { dateKey, text },
  });
}

export async function deleteDashboardOccasion(token, dateKey) {
  return apiRequest(`/api/dashboard/special-occasion/${encodeURIComponent(dateKey)}`, {
    method: "DELETE",
    token,
  });
}

export async function sendDashboardPing(token) {
  return apiRequest("/api/dashboard/ping", {
    method: "POST",
    token,
  });
}

export async function addDashboardChatMessage(token, text) {
  return apiRequest("/api/dashboard/chat-messages", {
    method: "POST",
    token,
    body: { text },
  });
}

export async function addDashboardTodo(token, text) {
  return apiRequest("/api/dashboard/todos", {
    method: "POST",
    token,
    body: { text },
  });
}

export async function updateDashboardTodo(token, todoId, updates) {
  return apiRequest(`/api/dashboard/todos/${todoId}`, {
    method: "PATCH",
    token,
    body: updates,
  });
}

export async function deleteDashboardTodo(token, todoId) {
  return apiRequest(`/api/dashboard/todos/${todoId}`, {
    method: "DELETE",
    token,
  });
}

export async function searchPlace(token, query) {
  return apiRequest(`/api/explore/place?query=${encodeURIComponent(query)}`, {
    method: "GET",
    token,
  });
}

export async function fetchLatestSongs(token, country = "us", limit = 12) {
  return apiRequest(
    `/api/music/latest?country=${encodeURIComponent(country)}&limit=${encodeURIComponent(limit)}`,
    {
      method: "GET",
      token,
    }
  );
}

export async function searchSongs(token, query, limit = 10) {
  return apiRequest(
    `/api/music/search?query=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}`,
    {
      method: "GET",
      token,
    }
  );
}

export async function resolveYouTubeSong(token, url) {
  return apiRequest(`/api/music/resolve-youtube?url=${encodeURIComponent(url)}`, {
    method: "GET",
    token,
  });
}
