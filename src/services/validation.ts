/**
 * Validadores de input compartidos.
 * Retornan string con el mensaje de error, o null si es válido.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email) return "El email es obligatorio";
  if (email.length > 254) return "Email demasiado largo";
  if (!EMAIL_REGEX.test(email)) return "Email no válido";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "La contraseña es obligatoria";
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
  if (password.length > 128) return "Contraseña demasiado larga (máx 128)";
  return null;
}

export function validateAge(age: number): string | null {
  if (!Number.isFinite(age)) return "Edad no válida";
  if (age < 14) return "Edad mínima: 14 años";
  if (age > 90) return "Edad máxima: 90 años";
  return null;
}

export function validateBodyweight(bw: number): string | null {
  if (!Number.isFinite(bw)) return "Peso no válido";
  if (bw < 30) return "Peso mínimo: 30 kg";
  if (bw > 250) return "Peso máximo: 250 kg";
  return null;
}

export function validateHeight(h: number): string | null {
  if (!Number.isFinite(h)) return "Altura no válida";
  if (h < 100) return "Altura mínima: 100 cm";
  if (h > 250) return "Altura máxima: 250 cm";
  return null;
}

export function validateWeight(w: number): string | null {
  if (!Number.isFinite(w)) return "Peso no válido";
  if (w < 0) return "Peso no puede ser negativo";
  if (w > 1000) return "Peso demasiado alto (máx 1000 kg)";
  return null;
}

export function validateReps(r: number): string | null {
  if (!Number.isInteger(r)) return "Reps debe ser entero";
  if (r < 0) return "Reps no puede ser negativo";
  if (r > 1000) return "Reps demasiado alto";
  return null;
}

export function validateRir(r: number | null): string | null {
  if (r === null) return null; // RIR es opcional
  if (!Number.isInteger(r)) return "RIR debe ser entero";
  if (r < 0) return "RIR no puede ser negativo";
  if (r > 10) return "RIR máximo: 10";
  return null;
}

export function validateRoutineName(n: string): string | null {
  if (!n || !n.trim()) return "El nombre es obligatorio";
  if (n.length > 60) return "Nombre demasiado largo (máx 60)";
  return null;
}

export function validateNotes(n: string): string | null {
  if (n && n.length > 500) return "Notas demasiado largas (máx 500)";
  return null;
}
