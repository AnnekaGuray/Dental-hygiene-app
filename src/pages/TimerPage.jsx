import { useState, useEffect, useRef, useCallback } from 'react';
import { useBrushingHistory } from '../hooks/useBrushingHistory';
import {
  isConnected, initiateSpotifyAuth, disconnect,
  getMe, getPlaybackState, play, pause, nextTrack, prevTrack,
} from '../utils/spotify';
import './TimerPage.css';

const DURATIONS = { '2 min': 120, '3 min': 180 };
const SESSION_TYPES = ['morning', 'night'];
const SESSION_ICONS = { morning: '☀️', night: '🌙' };

// ── Circular SVG countdown ────────────────────────────────────────────────────
function CircularTimer({ remaining, total, running, sessionType }) {
  const R = 88;
  const C = 2 * Math.PI * R;
  const progress = total > 0 ? remaining / total : 1;
  const offset = C * (1 - progress);
  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  const colorMap = { morning: '#f59e0b', night: '#6366f1' };
  const trackColor = colorMap[sessionType] || '#3b82f6';

  return (
    <div className="circular-timer">
      <svg width="220" height="220" viewBox="0 0 220 220">
        {/* Track */}
        <circle cx="110" cy="110" r={R} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        {/* Progress arc */}
        <circle
          cx="110" cy="110" r={R}
          fill="none"
          stroke={trackColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 110 110)"
          style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
        />
      </svg>
      <div className="timer-display">
        <span className="timer-time">{mins}:{secs}</span>
        <span className="timer-label">
          {running ? 'brushing…' : remaining === 0 ? '✓ done!' : 'ready'}
        </span>
      </div>
    </div>
  );
}

// ── Brushing history calendar strip ──────────────────────────────────────────
function HistoryStrip({ days }) {
  return (
    <div className="history-strip">
      {days.map(d => (
        <div key={d.key} className="history-day">
          <div className="history-label">{d.label.split(',')[0]}</div>
          <div className={`history-dot ${d.morning ? 'done' : ''}`} title="Morning">☀</div>
          <div className={`history-dot night ${d.night ? 'done' : ''}`} title="Night">🌙</div>
        </div>
      ))}
    </div>
  );
}

// ── Spotify mini-player ───────────────────────────────────────────────────────
function SpotifyPlayer({ connected, user, playback, onConnect, onDisconnect, onPlay, onPause, onNext, onPrev }) {
  if (!connected) {
    return (
      <div className="spotify-block disconnected">
        <div className="spotify-logo">
          <svg viewBox="0 0 24 24" fill="#1DB954" width="24" height="24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.441 17.307a.75.75 0 01-1.031.249c-2.825-1.727-6.38-2.117-10.566-1.16a.75.75 0 01-.333-1.463c4.582-1.046 8.516-.597 11.683 1.343a.75.75 0 01.247 1.031zm1.452-3.23a.937.937 0 01-1.288.308c-3.228-1.983-8.148-2.558-11.966-1.4a.938.938 0 01-.549-1.793c4.363-1.335 9.785-.688 13.495 1.598a.937.937 0 01.308 1.288zm.125-3.363C15.323 8.48 8.925 8.259 5.169 9.408a1.125 1.125 0 11-.654-2.153c4.357-1.323 11.595-1.067 16.17 1.635a1.124 1.124 0 01-1.667 1.824z"/>
          </svg>
        </div>
        <div>
          <p className="spotify-cta-title">Connect Spotify</p>
          <p className="spotify-cta-sub">Play music while you brush</p>
        </div>
        <button className="btn-spotify" onClick={onConnect}>Connect</button>
      </div>
    );
  }

  const isPlaying = playback?.is_playing;
  const track = playback?.item;

  return (
    <div className="spotify-block connected">
      <div className="spotify-track-info">
        {track?.album?.images?.[0]?.url && (
          <img src={track.album.images[0].url} alt="Album art" className="album-art" />
        )}
        <div className="track-text">
          <span className="track-name">{track?.name || 'Nothing playing'}</span>
          <span className="track-artist">{track?.artists?.map(a => a.name).join(', ') || (user?.display_name || 'Connected')}</span>
        </div>
      </div>
      <div className="spotify-controls">
        <button className="ctrl-btn" onClick={onPrev} title="Previous">⏮</button>
        <button className="ctrl-btn main" onClick={isPlaying ? onPause : onPlay} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="ctrl-btn" onClick={onNext} title="Next">⏭</button>
        <button className="ctrl-btn disconnect" onClick={onDisconnect} title="Disconnect Spotify">✕</button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TimerPage() {
  const [durationLabel, setDurationLabel] = useState('2 min');
  const [sessionType, setSessionType] = useState('morning');
  const [remaining, setRemaining] = useState(DURATIONS['2 min']);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(isConnected());
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [playback, setPlayback] = useState(null);

  const intervalRef = useRef(null);
  const { recordSession, todayStatus, streak, recentDays } = useBrushingHistory();

  const total = DURATIONS[durationLabel];
  const today = todayStatus();
  const currentStreak = streak();
  const days = recentDays(14);

  // Load Spotify user on mount if connected
  useEffect(() => {
    if (spotifyConnected) {
      getMe().then(u => setSpotifyUser(u));
      getPlaybackState().then(p => setPlayback(p));
    }
  }, [spotifyConnected]);

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setCompleted(true);
            recordSession(sessionType, total);
            if (spotifyConnected) pause();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleDuration = (label) => {
    if (running) return;
    setDurationLabel(label);
    setRemaining(DURATIONS[label]);
    setCompleted(false);
  };

  const handleStart = async () => {
    setRunning(true);
    setCompleted(false);
    if (spotifyConnected) {
      await play();
      const p = await getPlaybackState();
      setPlayback(p);
    }
  };

  const handlePause = () => {
    setRunning(false);
    if (spotifyConnected) pause();
  };

  const handleReset = () => {
    setRunning(false);
    setRemaining(DURATIONS[durationLabel]);
    setCompleted(false);
    if (spotifyConnected) pause();
  };

  const handleSpotifyConnect = () => initiateSpotifyAuth();

  const handleSpotifyDisconnect = () => {
    disconnect();
    setSpotifyConnected(false);
    setSpotifyUser(null);
    setPlayback(null);
  };

  const handleSpotifyPlay = async () => {
    await play();
    const p = await getPlaybackState();
    setPlayback(p);
  };

  const handleSpotifyPause = async () => {
    await pause();
    setPlayback(prev => prev ? { ...prev, is_playing: false } : prev);
  };

  const handleNext = async () => {
    await nextTrack();
    setTimeout(async () => setPlayback(await getPlaybackState()), 600);
  };

  const handlePrev = async () => {
    await prevTrack();
    setTimeout(async () => setPlayback(await getPlaybackState()), 600);
  };

  return (
    <div className="timer-page">
      {/* Left column – timer */}
      <div className="timer-col">
        <div className="timer-card">
          {/* Session type */}
          <div className="session-toggle">
            {SESSION_TYPES.map(type => (
              <button
                key={type}
                className={`session-btn ${sessionType === type ? 'active' : ''} ${type}`}
                onClick={() => { if (!running) setSessionType(type); }}
              >
                {SESSION_ICONS[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                {today[type]?.completed && <span className="done-badge">✓</span>}
              </button>
            ))}
          </div>

          {/* Duration selector */}
          <div className="duration-toggle">
            {Object.keys(DURATIONS).map(label => (
              <button
                key={label}
                className={`dur-btn ${durationLabel === label ? 'active' : ''}`}
                onClick={() => handleDuration(label)}
                disabled={running}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Circular timer */}
          <CircularTimer
            remaining={remaining}
            total={total}
            running={running}
            sessionType={sessionType}
          />

          {/* Controls */}
          <div className="timer-controls">
            {!running && remaining === total && !completed && (
              <button className="btn-primary btn-large" onClick={handleStart}>
                Start Brushing
              </button>
            )}
            {running && (
              <button className="btn-secondary btn-large" onClick={handlePause}>
                Pause
              </button>
            )}
            {!running && remaining < total && remaining > 0 && (
              <>
                <button className="btn-primary btn-large" onClick={handleStart}>Resume</button>
                <button className="btn-ghost btn-large" onClick={handleReset}>Reset</button>
              </>
            )}
            {completed && (
              <div className="completed-msg">
                <span className="completed-emoji">🎉</span>
                <span>Great brushing session!</span>
                <button className="btn-ghost" onClick={handleReset}>New Session</button>
              </div>
            )}
          </div>

          {/* Spotify */}
          <SpotifyPlayer
            connected={spotifyConnected}
            user={spotifyUser}
            playback={playback}
            onConnect={handleSpotifyConnect}
            onDisconnect={handleSpotifyDisconnect}
            onPlay={handleSpotifyPlay}
            onPause={handleSpotifyPause}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        </div>
      </div>

      {/* Right column – stats */}
      <div className="stats-col">
        {/* Today */}
        <div className="stats-card">
          <h3>Today</h3>
          <div className="today-row">
            <div className={`today-item ${today.morning?.completed ? 'done' : ''}`}>
              <span>☀️</span>
              <span>Morning</span>
              {today.morning?.completed
                ? <span className="check">✓ {Math.round(today.morning.duration / 60)} min</span>
                : <span className="pending-dot" />}
            </div>
            <div className={`today-item ${today.night?.completed ? 'done' : ''}`}>
              <span>🌙</span>
              <span>Night</span>
              {today.night?.completed
                ? <span className="check">✓ {Math.round(today.night.duration / 60)} min</span>
                : <span className="pending-dot" />}
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="stats-card streak-card">
          <div className="streak-icon">🔥</div>
          <div className="streak-text">
            <span className="streak-num">{currentStreak}</span>
            <span className="streak-label">day streak</span>
          </div>
        </div>

        {/* History */}
        <div className="stats-card history-card">
          <h3>Last 14 Days</h3>
          <HistoryStrip days={days} />
          <div className="history-legend">
            <span><span className="legend-dot done" />Completed</span>
            <span><span className="legend-dot" />Missed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
