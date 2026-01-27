// src/api.js
const API_BASE = process.env.REACT_APP_API_URL;

export async function apiFetch(path, options = {}) {
    return fetch(`${API_BASE}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });
}
