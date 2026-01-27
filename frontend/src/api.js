// src/api.js
const API_BASE = process.env.REACT_APP_API_URL;

export async function apiFetch(path, options = {}) {
    const headers = options.body instanceof FormData
        ? options.headers || {}
        : {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

    return fetch(`${API_BASE}${path}`, {
        ...options,
        headers
    });
}
