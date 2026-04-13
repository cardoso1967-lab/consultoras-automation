import type { Ciclo, Consultant } from './supabase';

/**
 * Verifica si la fecha actual está dentro del rango del ciclo activo.
 * Replica exactamente la lógica del nodo "Check Dates and Rules" de N8N.
 */
export function isWithinCycleDates(ciclo: Ciclo): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(ciclo.inicio + 'T00:00:00');
  const end = new Date(ciclo.fin + 'T23:59:59');

  return today >= start && today <= end;
}

/**
 * Filtra consultoras que necesitan recordatorio:
 * - Estatus Pendiente o Retrasada
 * - Situación Activa
 * - Tienen número de teléfono
 */
export function filterTargetConsultants(consultants: Consultant[]): Consultant[] {
  return consultants.filter(
    (c) =>
      (c.estatus === 'Pendiente' || c.estatus === 'Retrasada') &&
      c.situacion === 'Activa' &&
      c.telefono &&
      c.telefono.trim().length >= 10
  );
}

/**
 * Interpola variables dinámicas en el template del mensaje.
 * Soporta {{nombre}}, {{estatus}}, {{ciudad}}, {{semana}}
 */
export function interpolateMessage(template: string, consultant: Consultant, ciclo: Ciclo): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return template
    .replace(/\{\{nombre\}\}/gi, consultant.nombre?.split(' ')[0] || consultant.nombre)
    .replace(/\{\{nombre_completo\}\}/gi, consultant.nombre)
    .replace(/\{\{estatus\}\}/gi, consultant.estatus)
    .replace(/\{\{ciudad\}\}/gi, consultant.ciudad || 'tu ciudad')
    .replace(/\{\{semana\}\}/gi, consultant.semana || ciclo.numero)
    .replace(/\{\{ciclo\}\}/gi, ciclo.numero)
    .replace(/\{\{region\}\}/gi, ciclo.region)
    .replace(/\{\{fecha\}\}/gi, dateStr)
    .replace(/\{\{fin_ciclo\}\}/gi, new Date(ciclo.fin + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }));
}

/**
 * Normaliza el número de teléfono para México (+52).
 * Elimina caracteres especiales y agrega prefijo si falta.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('52') && digits.length >= 12) return digits;
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `52${digits.slice(1)}`;
  return digits;
}
