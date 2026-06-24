import { describe, expect, it } from 'vitest';
import { validatePasswordComplexity } from './auth';

describe('validatePasswordComplexity', () => {
  it('accepts a password meeting all complexity rules', () => {
    const result = validatePasswordComplexity('Segura1!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects short passwords without complexity', () => {
    const result = validatePasswordComplexity('abc');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Mínimo 8 caracteres');
    expect(result.errors).toContain('Al menos una mayúscula');
    expect(result.errors).toContain('Al menos un número');
    expect(result.errors).toContain('Al menos un carácter especial (!@#$...)');
  });

  it('reports missing uppercase, lowercase, number and special char separately', () => {
    const result = validatePasswordComplexity('abcdefgh');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Al menos una mayúscula');
    expect(result.errors).toContain('Al menos un número');
    expect(result.errors).toContain('Al menos un carácter especial (!@#$...)');
    expect(result.errors).not.toContain('Mínimo 8 caracteres');
  });
});
