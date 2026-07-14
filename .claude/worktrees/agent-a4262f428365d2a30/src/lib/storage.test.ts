import { beforeEach, describe, expect, it } from 'vitest';
import { loadFromStorage, saveToStorage } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the fallback when the key does not exist', () => {
    expect(loadFromStorage('missing', { ready: false })).toEqual({ ready: false });
  });

  it('persists values and revives ISO dates', () => {
    const createdAt = new Date('2026-06-13T12:00:00.000Z');
    saveToStorage('course', { createdAt });

    const stored = loadFromStorage<{ createdAt: Date }>('course', { createdAt: new Date(0) });

    expect(stored.createdAt).toBeInstanceOf(Date);
    expect(stored.createdAt.toISOString()).toBe(createdAt.toISOString());
  });
});
