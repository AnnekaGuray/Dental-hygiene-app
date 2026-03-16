import { useState, useCallback } from 'react';

const KEY = 'dental_brushing_history';

function todayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}

export function useBrushingHistory() {
  const [history, setHistory] = useState(load);

  const recordSession = useCallback((sessionType, durationSecs) => {
    const key = todayKey();
    setHistory(prev => {
      const updated = {
        ...prev,
        [key]: {
          ...prev[key],
          [sessionType]: {
            completed: true,
            duration: durationSecs,
            timestamp: new Date().toISOString(),
          },
        },
      };
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /** Returns { morning, night } for today */
  const todayStatus = useCallback(() => {
    return history[todayKey()] || {};
  }, [history]);

  /** Consecutive days with at least one completed session */
  const streak = useCallback(() => {
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = d.toISOString().split('T')[0];
      const day = history[k];
      if (day?.morning?.completed || day?.night?.completed) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [history]);

  /** Last n days as array of { key, label, morning, night } */
  const recentDays = useCallback((n = 14) => {
    const result = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().split('T')[0];
      result.push({
        key: k,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        morning: !!history[k]?.morning?.completed,
        night: !!history[k]?.night?.completed,
      });
    }
    return result;
  }, [history]);

  return { history, recordSession, todayStatus, streak, recentDays };
}
