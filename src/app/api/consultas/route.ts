import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { parseConsultaPayload, requireSupabase } from '@/lib/consultas-api';
import { rowToConsulta, type ConsultaRow } from '@/types/consulta';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { supabase, errorResponse } = requireSupabase();
  if (errorResponse || !supabase) {
    return errorResponse!;
  }

  const { data, error } = await supabase
    .from('consultas')
    .select('*')
    .order('creado_en', { ascending: false });

  if (error) {
    return NextResponse.json(
      { configured: true, error: error.message },
      { status: 500 }
    );
  }

  const consultas = ((data ?? []) as ConsultaRow[]).map(rowToConsulta);
  return NextResponse.json({ configured: true, consultas });
}

export async function POST(request: Request) {
  const { supabase, errorResponse } = requireSupabase();
  if (errorResponse || !supabase) {
    return errorResponse!;
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo JSON inválido.' },
      { status: 400 }
    );
  }

  const parsed = parseConsultaPayload(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const id = crypto.randomUUID();

  const { data, error } = await supabase
    .from('consultas')
    .insert({
      id,
      vertical: parsed.data.vertical,
      pregunta: parsed.data.pregunta,
      tipo_deal: parsed.data.tipoDeal,
      descripcion: parsed.data.descripcion,
      deal: parsed.data.deal,
      autor: parsed.data.autor,
      estado: 'pendiente',
      creado_en: nowIso,
      editado_en: null,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'No se pudo guardar la consulta.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { consulta: rowToConsulta(data as ConsultaRow) },
    { status: 201 }
  );
}
