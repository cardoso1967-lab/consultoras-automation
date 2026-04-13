import { normalizePhone } from './rules';
import { insertLog } from './supabase';
import type { Consultant, Ciclo } from './supabase';

const ZAPI_BASE = 'https://api.z-api.io/instances';
const INSTANCE_ID = import.meta.env.VITE_ZAPI_INSTANCE_ID;
const TOKEN = import.meta.env.VITE_ZAPI_TOKEN;
const CLIENT_TOKEN = import.meta.env.VITE_ZAPI_CLIENT_TOKEN;

export interface SendResult {
  consultant: Consultant;
  phone: string;
  success: boolean;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Envía un mensaje de WhatsApp vía Z-API.
 * En modo prueba, redirige al número de test.
 */
async function sendZapiMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const url = `${ZAPI_BASE}/${INSTANCE_ID}/token/${TOKEN}/send-text`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'client-token': CLIENT_TOKEN,
      },
      body: JSON.stringify({
        phone,
        message,
        delayMessage: 2,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data?.message || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error };
  }
}

export interface RunConfig {
  consultants: Consultant[];
  ciclo: Ciclo;
  messageTemplate: string;
  isTest: boolean;
  testPhone?: string;
  onProgress?: (result: SendResult, index: number, total: number) => void;
}

/**
 * Orquesta el envío masivo con delay entre mensajes para evitar bloqueos de WhatsApp.
 */
export async function runCampaign(config: RunConfig): Promise<SendResult[]> {
  const { consultants, ciclo, messageTemplate, isTest, testPhone, onProgress } = config;
  const results: SendResult[] = [];
  const DELAY_MS = 2500; // 2.5s entre mensajes

  for (let i = 0; i < consultants.length; i++) {
    const consultant = consultants[i];
    const rawPhone = isTest ? (testPhone || '') : (consultant.telefono || '');

    if (!rawPhone) {
      const result: SendResult = {
        consultant,
        phone: '',
        success: false,
        skipped: true,
        skipReason: 'Sin número de teléfono',
      };
      results.push(result);
      onProgress?.(result, i, consultants.length);
      continue;
    }

    const phone = normalizePhone(rawPhone);

    // Interpolate message (import here to avoid circular)
    const { interpolateMessage } = await import('./rules');
    const message = interpolateMessage(messageTemplate, consultant, ciclo);

    const { success, error } = await sendZapiMessage(phone, message);

    const result: SendResult = { consultant, phone, success, error };
    results.push(result);
    onProgress?.(result, i, consultants.length);

    // Log to Supabase
    await insertLog({
      ciclo_id: ciclo.id,
      consultant_id: consultant.id,
      consultant_name: consultant.nombre,
      phone,
      message,
      status: success ? 'success' : 'error',
      error_message: error || null,
      is_test: isTest,
    });

    // Delay between sends (skip delay on last message)
    if (i < consultants.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  return results;
}
