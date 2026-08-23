import { Injectable } from '@angular/core';

/** Thin wrapper around localStorage/sessionStorage — the persistence primitive every repository builds on. */
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  getSession<T>(key: string): T | null {
    try {
      const data = sessionStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch {
      return null;
    }
  }

  setSession<T>(key: string, value: T): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  clearSession(): void {
    sessionStorage.clear();
  }

  nextId(entity: string): number {
    const counters = this.get<Record<string, number>>('se_counters') || {};
    counters[entity] = (counters[entity] || 0) + 1;
    this.set('se_counters', counters);
    return counters[entity];
  }
}
