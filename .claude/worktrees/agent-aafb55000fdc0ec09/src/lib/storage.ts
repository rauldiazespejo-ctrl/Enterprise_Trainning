// Persistencia local con localStorage
// Guarda y recupera el estado de la plataforma reviviendo fechas ISO como Date

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

const dateReviver = (_key: string, value: unknown): unknown => {
  if (typeof value === 'string' && ISO_DATE_REGEX.test(value)) {
    return new Date(value);
  }
  return value;
};

export const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw, dateReviver) as T;
  } catch {
    return fallback;
  }
};

export const saveToStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Cuota llena o storage no disponible: la app sigue funcionando en memoria
  }
};

export const STORAGE_KEYS = {
  users: 'capacitapro_users',
  session: 'capacitapro_user',
  courses: 'capacitapro_courses',
  assignments: 'capacitapro_assignments',
  certificates: 'capacitapro_certificates',
  progress: 'capacitapro_progress',
} as const;
