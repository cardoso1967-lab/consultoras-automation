import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Types based on real schema ──
export interface Ciclo {
  id: string;
  region: string;
  numero: string;
  inicio: string; // date
  fin: string;    // date
  link_calendly: string | null;
  created_at: string;
}

export interface Consultant {
  id: string;
  nombre: string;
  telefono: string | null;
  estatus: 'Pendiente' | 'Cerrado' | 'Agendado' | 'Retrasada';
  situacion: 'Activa' | 'Inactiva';
  ciudad: string | null;
  colonia: string | null;
  semana: string | null;
}

export interface SendLog {
  id: string;
  ciclo_id: string;
  consultant_id: string;
  consultant_name: string;
  phone: string;
  message: string;
  status: 'success' | 'error' | 'skipped';
  error_message: string | null;
  sent_at: string;
  is_test: boolean;
}

// ── Queries ──
export async function getActiveCycles(): Promise<Ciclo[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('ciclos')
    .select('*')
    .lte('inicio', today)
    .gte('fin', today)
    .order('inicio', { ascending: false });

  if (error) throw new Error(`Error fetching active cycles: ${error.message}`);
  return data || [];
}

export async function getAllCycles(): Promise<Ciclo[]> {
  const { data, error } = await supabase
    .from('ciclos')
    .select('*')
    .order('inicio', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getConsultants(): Promise<Consultant[]> {
  const { data, error } = await supabase
    .from('consultants')
    .select('id, nombre, telefono, estatus, situacion, ciudad, colonia, semana')
    .in('estatus', ['Pendiente', 'Retrasada'])
    .eq('situacion', 'Activa')
    .order('nombre');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAllConsultantsRaw(): Promise<Consultant[]> {
  const { data, error } = await supabase
    .from('consultants')
    .select('id, nombre, telefono, estatus, situacion, ciudad, colonia, semana')
    .order('nombre');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getLogs(): Promise<SendLog[]> {
  const { data, error } = await supabase
    .from('send_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(200);
  if (error) {
    console.warn('send_logs table not yet created:', error.message);
    return [];
  }
  return data || [];
}

export async function insertLog(log: Omit<SendLog, 'id' | 'sent_at'>): Promise<void> {
  const { error } = await supabase.from('send_logs').insert([log]);
  if (error) console.error('Log insert error:', error.message);
}

export async function updateConsultant(id: string, updates: Partial<Consultant>): Promise<void> {
  const { error } = await supabase
    .from('consultants')
    .update(updates)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteConsultant(id: string): Promise<void> {
  const { error } = await supabase
    .from('consultants')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
