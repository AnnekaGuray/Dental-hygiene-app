import { useState } from 'react';
import './VideosPage.css';

// Replace YouTube IDs with your preferred oral hygiene videos
const VIDEOS = [
  {
    id: 1,
    title: 'How to Brush Your Teeth Properly',
    description: 'Learn the Bass brushing technique recommended by dental professionals.',
    category: 'Brushing',
    youtubeId: 'EQYQ2VhNgCM',
    duration: '3:24',
  },
  {
    id: 2,
    title: 'How to Floss Correctly',
    description: 'Step-by-step guide to flossing every tooth, including back molars.',
    category: 'Flossing',
    youtubeId: 'LFqMX4AJ7xg',
    duration: '2:15',
  },
  {
    id: 3,
    title: 'Electric vs Manual Toothbrush',
    description: 'Which removes more plaque? A head-to-head comparison.',
    category: 'Brushing',
    youtubeId: 'RH01j9yGFGE',
    duration: '4:12',
  },
  {
    id: 4,
    title: 'Interdental Brush Guide',
    description: 'Using interdental brushes to clean between teeth where floss can\'t reach.',
    category: 'Flossing',
    youtubeId: 'xwlHvU15mQ4',
    duration: '3:45',
  },
  {
    id: 5,
    title: 'Understanding Gum Disease',
    description: 'What causes gingivitis and periodontitis, and how to prevent them.',
    category: 'Gum Health',
    youtubeId: 'R_lLKsB6mEM',
    duration: '5:30',
  },
  {
    id: 6,
    title: 'Tongue Cleaning Basics',
    description: 'Removing bacteria from the tongue to reduce bad breath and improve health.',
    category: 'Oral Hygiene',
    youtubeId: 'zLNNKp5Y1kw',
    duration: '2:45',
  },
  {
    id: 7,
    title: 'Mouthwash: How and When',
    description: 'Choosing the right mouthwash and the best time to use it in your routine.',
    category: 'Oral Hygiene',
    youtubeId: 'Wgq5QHWI3sM',
    duration: '2:55',
  },
  {
    id: 8,
    title: 'Kids Brushing Routine',
    description: 'Making tooth brushing engaging and effective for children.',
    category: 'Children',
    youtubeId: 'bXSS49N4PNE',
    duration: '2:30',
  },
];

const CATEGORIES = ['All', ...Array.from(new Set(VIDEOS.map(v => v.category)))];

const CATEGORY_COLORS = {
  Brushing:       '#3b82f6',
  Flossing:       '#10b981',
  'Gum Health':   '#f59e0b',
  'Oral Hygiene': '#8b5cf6',
  Children:       '#ec4899',
};

export default function VideosPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [playingId, setPlayingId] = useState(null);

  const filtered = activeCategory === 'All'
    ? VIDEOS
    : VIDEOS.filter(v => v.category === activeCategory);

  return (
    <div className="videos-page">
      <div className="videos-header">
        <div className="videos-header-text">
          <h1>Oral Hygiene Education</h1>
          <p>Learn proper techniques for a healthier smile.</p>
        </div>
        <div className="category-filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
              style={activeCategory === cat && cat !== 'All'
                ? { background: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat], color: '#fff' }
                : {}}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="videos-grid">
        {filtered.map(video => (
          <div key={video.id} className="video-card">
            <div className="video-embed-wrap">
              {playingId === video.id ? (
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  className="video-thumb"
                  style={{ backgroundImage: `url(https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg)` }}
                  onClick={() => setPlayingId(video.id)}
                  aria-label={`Play ${video.title}`}
                >
                  <span className="play-circle">&#9654;</span>
                  <span className="video-duration">{video.duration}</span>
                </button>
              )}
            </div>
            <div className="video-info">
              <span
                className="video-cat-tag"
                style={{ color: CATEGORY_COLORS[video.category] || 'var(--primary)' }}
              >
                {video.category}
              </span>
              <h3>{video.title}</h3>
              <p>{video.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
