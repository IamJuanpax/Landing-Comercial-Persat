import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { isValidVertical, type Vertical } from '@/types/consulta';

export interface ConsultaPayload {
  vertical: Vertical;
  pregunta: string;
  tipoDeal: string;
  descripcion: string;
  deal: string;
  autor: string;
}

export function requireSupabase() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      supabase: null,
      errorResponse: NextResponse.json(
        {
          configured: false,
          error:
            'Supabase no está configurado. Revisá GUIA-SUPABASE.md y creá el archivo .env.local con tus credenciales.',
        },
        { status: 503 }
      ),
    };
  }
  return { supabase, errorResponse: null };
}

export function parseConsultaPayload(
  body: Record<string, unknown>
): { data?: ConsultaPayload; error?: string } {
  const vertical = body.vertical;
  const pregunta = typeof body.pregunta === 'string' ? body.pregunta.trim() : '';
  const tipoDeal = typeof body.tipoDeal === 'string' ? body.tipoDeal : '';
  const descripcion =
    typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
  const deal = typeof body.deal === 'string' ? body.deal.trim() : '';
  const autor = typeof body.autor === 'string' ? body.autor.trim() : '';

  if (!isValidVertical(vertical)) {
    return { error: 'La vertical seleccionada no es válida.' };
  }
  if (!pregunta || !tipoDeal.trim() || !descripcion || !autor) {
    return { error: 'Completá todos los campos obligatorios.' };
  }

  return {
    data: {
      vertical,
      pregunta,
      tipoDeal,
      descripcion,
      deal,
      autor,
    },
  };
}
