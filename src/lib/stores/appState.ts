import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { SiteReport } from '../types';

const STORAGE_KEY_HISTORY = 'siteglow_history';
const STORAGE_KEY_FAVORITES = 'siteglow_favorites';

function createPersistedStore<T>(key: string, startValue: T) {
  const initialValue = browser ? JSON.parse(localStorage.getItem(key) || JSON.stringify(startValue)) : startValue;
  const { subscribe, set, update } = writable<T>(initialValue);

  return {
    subscribe,
    set: (value: T) => {
      if (browser) localStorage.setItem(key, JSON.stringify(value));
      set(value);
    },
    update: (fn: (v: T) => T) => {
      update((v) => {
        const newValue = fn(v);
        if (browser) localStorage.setItem(key, JSON.stringify(newValue));
        return newValue;
      });
    }
  };
}

export const history = createPersistedStore<SiteReport[]>(STORAGE_KEY_HISTORY, []);
export const favorites = createPersistedStore<SiteReport[]>(STORAGE_KEY_FAVORITES, []);

export function addToHistory(report: SiteReport) {
  history.update(h => {
    const filtered = h.filter(item => item.domain !== report.domain);
    return [report, ...filtered].slice(0, 50);
  });
}

export function toggleFavorite(report: SiteReport) {
  favorites.update(f => {
    const exists = f.find(item => item.domain === report.domain);
    if (exists) {
      return f.filter(item => item.domain !== report.domain);
    } else {
      return [report, ...f];
    }
  });
}
