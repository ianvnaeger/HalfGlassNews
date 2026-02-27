const API_BASE = '/api';

async function parseJson(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || 'Unexpected server error');
  }

  return payload;
}

export async function fetchNews(limit = 8) {
  const res = await fetch(`${API_BASE}/news?limit=${encodeURIComponent(limit)}`);
  return parseJson(res);
}

export async function spinStory({ title, description, url, mood }) {
  const res = await fetch(`${API_BASE}/spin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, description, url, mood })
  });

  return parseJson(res);
}
