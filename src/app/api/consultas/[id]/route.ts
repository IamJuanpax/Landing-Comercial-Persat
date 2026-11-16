import { NextResponse } from 'next/server';
import { parseConsultaPayload, requireSupabase } from '@/lib/consultas-api';
import {
  isValidEstado,
  rowToConsulta,
  type ConsultaRow,
} from '@/types/consulta';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { supabase, errorResponse } = requireSupabase();
  if (errorResponse || !supabase) {
    return errorResponse!;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'ID requerido.' }, { status: 400 });
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

  // Cambio rápido de estado (sin alterar fecha de edición de contenido)
  if (
    Object.keys(body).length === 1 &&
    body.estado !== undefined
  ) {
    if (!isValidEstado(body.estado)) {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('consultas')
      .update({ estado: body.estado })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Consulta no encontrada.' },
        { status: error?.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({
      consulta: rowToConsulta(data as ConsultaRow),
    });
  }

  // Edición completa de la consulta
  const parsed = parseConsultaPayload(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updateFields: Record<string, unknown> = {
    vertical: parsed.data.vertical,
    pregunta: parsed.data.pregunta,
    tipo_deal: parsed.data.tipoDeal,
    descripcion: parsed.data.descripcion,
    deal: parsed.data.deal,
    autor: parsed.data.autor,
    editado_en: new Date().toISOString(),
  };

  if (body.estado !== undefined) {
    if (!isValidEstado(body.estado)) {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
    }
    updateFields.estado = body.estado;
  }

  const { data, error } = await supabase
    .from('consultas')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Consulta no encontrada.' },
      { status: error?.code === 'PGRST116' ? 404 : 500 }
    );
  }

  return NextResponse.json({
    consulta: rowToConsulta(data as ConsultaRow),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { supabase, errorResponse } = requireSupabase();
  if (errorResponse || !supabase) {
    return errorResponse!;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'ID requerido.' }, { status: 400 });
  }

  const { error } = await supabase.from('consultas').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
