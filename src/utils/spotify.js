// Spotify PKCE OAuth + Web API helpers
// Set VITE_SPOTIFY_CLIENT_ID in your .env.local file

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = window.location.origin + window.location.pathname;

const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
].join(' ');

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function generateVerifier(length = 128) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, v => chars[v % chars.length]).join('');
}

async function generateChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function initiateSpotifyAuth() {
  if (!CLIENT_ID) {
    alert('Spotify Client ID not set. Add VITE_SPOTIFY_CLIENT_ID to your .env.local file.');
    return;
  }
  const verifier = generateVerifier();
  const challenge = await generateChallenge(verifier);
  localStorage.setItem('spotify_verifier', verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function handleSpotifyCallback(code) {
  const verifier = localStorage.getItem('spotify_verifier');
  if (!verifier) return null;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem('spotify_access_token', data.access_token);
    localStorage.setItem('spotify_refresh_token', data.refresh_token || '');
    localStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in || 3600) * 1000);
    localStorage.removeItem('spotify_verifier');
  }
  return data.access_token || null;
}

async function refreshToken() {
  const refresh = localStorage.getItem('spotify_refresh_token');
  if (!refresh) return null;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh,
      client_id: CLIENT_ID,
    }),
  });
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem('spotify_access_token', data.access_token);
    if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token);
    localStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in || 3600) * 1000);
    return data.access_token;
  }
  return null;
}

async function getToken() {
  const expiry = parseInt(localStorage.getItem('spotify_token_expiry') || '0');
  if (Date.now() > expiry - 60_000) {
    return await refreshToken();
  }
  return localStorage.getItem('spotify_access_token');
}

export function isConnected() {
  return !!localStorage.getItem('spotify_access_token');
}

export function disconnect() {
  ['spotify_access_token', 'spotify_refresh_token', 'spotify_token_expiry'].forEach(k =>
    localStorage.removeItem(k)
  );
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function api(path, options = {}) {
  const token = await getToken();
  if (!token) return null;
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  });
  if (res.status === 204 || res.status === 202) return {};
  if (!res.ok) return null;
  return res.json().catch(() => ({}));
}

export async function getMe() {
  return api('/me');
}

export async function getPlaybackState() {
  return api('/me/player');
}

export async function play(contextUri) {
  const body = contextUri ? JSON.stringify({ context_uri: contextUri }) : undefined;
  return api('/me/player/play', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

export async function pause() {
  return api('/me/player/pause', { method: 'PUT' });
}

export async function nextTrack() {
  return api('/me/player/next', { method: 'POST' });
}

export async function prevTrack() {
  return api('/me/player/previous', { method: 'POST' });
}

export async function getUserPlaylists() {
  return api('/me/playlists?limit=20');
}
