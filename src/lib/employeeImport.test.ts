import { describe, expect, it } from 'vitest';
import { employeeEmailFromRut, isValidRut, normalizeRut, rutBodyNoDv } from './employeeImport';

describe('employee import helpers', () => {
  it('normalizes and validates Chilean RUT values', () => {
    expect(normalizeRut('20.089.645-9')).toBe('20089645-9');
    expect(isValidRut('20.089.645-9')).toBe(true);
    expect(isValidRut('20.089.645-1')).toBe(false);
  });

  it('normalizes RUTs with spaces, lowercase verifier and missing dash', () => {
    expect(normalizeRut(' 12.345.678-k ')).toBe('12345678-K');
    expect(normalizeRut('12345678K')).toBe('12345678K');
    expect(isValidRut('12.345.678-5')).toBe(true);
    expect(isValidRut('123456785')).toBe(true);
  });

  it('rejects malformed RUT values', () => {
    expect(isValidRut('')).toBe(false);
    expect(isValidRut('abcdefg')).toBe(false);
    expect(isValidRut('12.345.678')).toBe(false);
    expect(isValidRut('12.345.678-99')).toBe(false);
    expect(isValidRut('1.234.567-0')).toBe(false);
  });

  it('extracts the RUT body without verifier', () => {
    expect(rutBodyNoDv('20.089.645-9')).toBe('20089645');
    expect(rutBodyNoDv('200896459')).toBe('20089645');
  });

  it('creates a stable internal login email', () => {
    expect(employeeEmailFromRut('20.089.645-9')).toBe('200896459@acceso.soldesp.cl');
  });
});
