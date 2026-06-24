export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export function validatePasswordComplexity(password: string): PasswordValidation {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Al menos una mayúscula');
  if (!/[a-z]/.test(password)) errors.push('Al menos una minúscula');
  if (!/\d/.test(password)) errors.push('Al menos un número');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Al menos un carácter especial (!@#$...)');
  return { valid: errors.length === 0, errors };
}
