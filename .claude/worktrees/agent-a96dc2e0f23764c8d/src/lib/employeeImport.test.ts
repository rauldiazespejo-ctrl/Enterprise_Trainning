import { describe, expect, it } from 'vitest';
import { employeeEmailFromRut, isValidRut, normalizeRut } from './employeeImport';

describe('employee import helpers', () => {
  it('normalizes and validates Chilean RUT values', () => {
    expect(normalizeRut('20.089.645-9')).toBe('20089645-9');
    expect(isValidRut('20.089.645-9')).toBe(true);
    expect(isValidRut('20.089.645-1')).toBe(false);
  });

  it('creates a stable internal login email', () => {
    expect(employeeEmailFromRut('20.089.645-9')).toBe('200896459@acceso.soldesp.cl');
  });
});
