import { useState, Suspense } from 'react';
import { ALL_TEETH, STATUS_COLORS, STATUS_LABELS } from '../utils/toothData';
import TeethScene from '../three/TeethScene';
import './TeethPage.css';

const STATUS_CYCLE = ['healthy', 'watch', 'attention'];

const STATUS_ICONS = {
  healthy:   '✓',
  watch:     '●',
  attention: '!',
};

export default function TeethPage() {
  const [statuses, setStatuses] = useState({});          // toothId → status
  const [selected, setSelected] = useState(null);        // selected tooth object
  const [showUpper, setShowUpper] = useState(true);
  const [showLower, setShowLower] = useState(true);

  const handleToothClick = (tooth) => {
    setSelected(tooth);
  };

  const setStatus = (status) => {
    if (!selected) return;
    setStatuses(prev => ({ ...prev, [selected.id]: status }));
  };

  const resetAll = () => {
    setStatuses({});
    setSelected(null);
  };

  const counts = ALL_TEETH.reduce((acc, t) => {
    const s = statuses[t.id] || 'healthy';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="teeth-page">
      {/* Toolbar */}
      <div className="teeth-toolbar">
        <div className="toolbar-left">
          <h2>Teeth Map</h2>
          <p>Click any tooth to select, then set its status below.</p>
        </div>
        <div className="toolbar-controls">
          <label className="arch-toggle">
            <input type="checkbox" checked={showUpper} onChange={e => setShowUpper(e.target.checked)} />
            Upper Arch
          </label>
          <label className="arch-toggle">
            <input type="checkbox" checked={showLower} onChange={e => setShowLower(e.target.checked)} />
            Lower Arch
          </label>
          <button className="btn-reset" onClick={resetAll}>Reset All</button>
        </div>
      </div>

      <div className="teeth-layout">
        {/* 3D Canvas */}
        <div className="canvas-wrap">
          <Suspense fallback={<div className="canvas-loading">Loading 3D model…</div>}>
            <TeethScene
              statuses={statuses}
              onToothClick={handleToothClick}
              showUpper={showUpper}
              showLower={showLower}
            />
          </Suspense>
          <div className="canvas-hint">Drag to rotate · Scroll to zoom · Right-drag to pan</div>
        </div>

        {/* Side panel */}
        <div className="teeth-panel">
          {/* Selected tooth */}
          <div className="panel-card selected-card">
            <h4>Selected Tooth</h4>
            {selected ? (
              <>
                <div className="selected-name">
                  <span className="tooth-num">#{selected.number}</span>
                  {selected.name}
                </div>
                <div className="selected-arch">{selected.arch.charAt(0).toUpperCase() + selected.arch.slice(1)} arch · {selected.type}</div>
                <div className="status-btns">
                  {STATUS_CYCLE.map(s => (
                    <button
                      key={s}
                      className={`status-btn ${s} ${(statuses[selected.id] || 'healthy') === s ? 'active' : ''}`}
                      onClick={() => setStatus(s)}
                    >
                      <span className="status-dot" style={{ background: STATUS_COLORS[s] }} />
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="no-selection">Click a tooth in the 3D model to select it.</p>
            )}
          </div>

          {/* Legend */}
          <div className="panel-card">
            <h4>Legend</h4>
            <div className="legend-list">
              {STATUS_CYCLE.map(s => (
                <div key={s} className="legend-item">
                  <span className="legend-swatch" style={{ background: STATUS_COLORS[s] }} />
                  <span className="legend-label">{STATUS_LABELS[s]}</span>
                  <span className="legend-count">{counts[s] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Marked teeth list */}
          {Object.keys(statuses).filter(id => statuses[id] !== 'healthy').length > 0 && (
            <div className="panel-card">
              <h4>Focus Areas</h4>
              <div className="focus-list">
                {ALL_TEETH
                  .filter(t => statuses[t.id] && statuses[t.id] !== 'healthy')
                  .sort((a, b) => (statuses[b.id] === 'attention' ? 1 : 0) - (statuses[a.id] === 'attention' ? 1 : 0))
                  .map(t => (
                    <button
                      key={t.id}
                      className={`focus-item ${statuses[t.id]}`}
                      onClick={() => setSelected(t)}
                    >
                      <span
                        className="focus-dot"
                        style={{ background: STATUS_COLORS[statuses[t.id]] }}
                      />
                      <span className="focus-num">#{t.number}</span>
                      <span className="focus-name">{t.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="panel-card instructions-card">
            <h4>How to use</h4>
            <ol>
              <li>Rotate the 3D model to find the tooth.</li>
              <li>Click the tooth to select it.</li>
              <li>Set its status: Healthy, Monitor, or Needs Attention.</li>
              <li>Use "Focus Areas" to review marked teeth with the patient.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
