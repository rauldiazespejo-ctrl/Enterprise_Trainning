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

export function getLoginErrorMessage(error: unknown, mode: 'admin' | 'employee'): string {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase();

  if (message.includes('failed to fetch') || message.includes('network') || message.includes('timeout')) {
    return 'No pudimos conectar con el servicio de acceso. Revisa tu conexión e intenta nuevamente.';
  }

  if (message.includes('email not confirmed')) {
    return 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada.';
  }

  return mode === 'employee'
    ? 'No pudimos validar este RUT. Verifica que esté registrado o solicita al administrador sincronizar sus credenciales.'
    : 'Correo o contraseña incorrectos.';
}
