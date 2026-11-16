import { NextResponse } from 'next/server';
import { requireSupabase } from '@/lib/consultas-api';
import {
  isValidEstado,
  isValidVertical,
  rowToConsulta,
  type ConsultaRow,
} from '@/types/consulta';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { supabase, errorResponse } = requireSupabase();
  if (errorResponse || !supabase) {
    return errorResponse!;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'El archivo no tiene un formato válido.' },
      { status: 400 }
    );
  }

  const rawList = Array.isArray(body)
    ? body
    : typeof body === 'object' &&
        body !== null &&
        Array.isArray((body as { consultas?: unknown }).consultas)
      ? (body as { consultas: unknown[] }).consultas
      : null;

  if (!rawList) {
    return NextResponse.json(
      { error: 'El archivo no tiene un formato válido.' },
      { status: 400 }
    );
  }

  const { data: existingRows, error: fetchError } = await supabase
    .from('consultas')
    .select('id');

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const existingIds = new Set(
    (existingRows ?? []).map((row) => String((row as { id: string }).id))
  );

  const toInsert: Array<{
    id: string;
    vertical: string;
    pregunta: string;
    tipo_deal: string;
    descripcion: string;
    deal: string;
    autor: string;
    estado: string;
    creado_en: string;
    editado_en: string | null;
  }> = [];

  for (const item of rawList) {
    if (typeof item !== 'object' || item === null) continue;
    const rec = item as Record<string, unknown>;
    const id = typeof rec.id === 'string' ? rec.id.trim() : '';
    const pregunta =
      typeof rec.pregunta === 'string' ? rec.pregunta.trim() : '';

    if (!id || !pregunta || existingIds.has(id)) {
      continue;
    }
    existingIds.add(id);

    const creadoMs =
      typeof rec.creado === 'number' && Number.isFinite(rec.creado)
        ? rec.creado
        : Date.now();
    const editadoMs =
      typeof rec.editado === 'number' && Number.isFinite(rec.editado)
        ? rec.editado
        : null;

    toInsert.push({
      id,
      vertical: isValidVertical(rec.vertical) ? rec.vertical : 'tecnicos',
      pregunta,
      tipo_deal: typeof rec.tipoDeal === 'string' ? rec.tipoDeal : '',
      descripcion:
        typeof rec.descripcion === 'string' ? rec.descripcion.trim() : '',
      deal: typeof rec.deal === 'string' ? rec.deal.trim() : '',
      autor: typeof rec.autor === 'string' ? rec.autor.trim() : '',
      estado: isValidEstado(rec.estado) ? rec.estado : 'pendiente',
      creado_en: new Date(creadoMs).toISOString(),
      editado_en: editadoMs ? new Date(editadoMs).toISOString() : null,
    });
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ imported: 0, consultas: [] });
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from('consultas')
    .insert(toInsert)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const consultas = ((insertedRows ?? []) as ConsultaRow[]).map(rowToConsulta);
  return NextResponse.json({
    imported: consultas.length,
    consultas,
  });
}
