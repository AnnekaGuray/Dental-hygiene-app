import { useState, useEffect } from 'react';
import './App.css';
import VideosPage from './pages/VideosPage';
import TimerPage from './pages/TimerPage';
import TeethPage from './pages/TeethPage';
import { handleSpotifyCallback } from './utils/spotify';

const TABS = [
  { id: 'videos', label: 'Hygiene Videos', icon: '▶' },
  { id: 'timer',  label: 'Brush Timer',    icon: '⏱' },
  { id: 'teeth',  label: 'Teeth Map',      icon: '🦷' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('videos');

  useEffect(() => {
    // Handle Spotify OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      handleSpotifyCallback(code).then(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setActiveTab('timer');
      });
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🦷</span>
            <span className="logo-text">DentalCare</span>
          </div>
          <nav className="tab-nav" role="tablist">
            {TABS.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'videos' && <VideosPage />}
        {activeTab === 'timer'  && <TimerPage />}
        {activeTab === 'teeth'  && <TeethPage />}
      </main>
    </div>
  );
}
