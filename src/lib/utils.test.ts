import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn (tailwind class merge)', () => {
  it('merges static class names', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
  });

  it('resolves conditional class names', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('merges conflicting Tailwind utilities using the last value', () => {
    expect(cn('text-sm text-red-500', 'text-lg text-blue-500')).toBe('text-lg text-blue-500');
  });

  it('ignores falsy values', () => {
    expect(cn('base', null, undefined, '', 0, false)).toBe('base');
  });
});
