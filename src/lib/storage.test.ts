import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('returns fallback when stored JSON is corrupt', () => {
    localStorage.setItem('corrupt', '{ not json');
    expect(loadFromStorage('corrupt', { fallback: true })).toEqual({ fallback: true });
  });

  it('does not revive non-ISO date strings', () => {
    saveToStorage('labels', { createdAt: '13/06/2026' });
    const stored = loadFromStorage<{ createdAt: string }>('labels', { createdAt: '' });
    expect(stored.createdAt).toBe('13/06/2026');
  });

  it('silently ignores write errors such as quota exceeded', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => saveToStorage('key', { value: 1 })).not.toThrow();

    setItemSpy.mockRestore();
  });
});
