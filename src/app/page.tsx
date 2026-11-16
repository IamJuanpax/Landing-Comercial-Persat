import PortalAutomatizaciones from '@/app/components/PortalAutomatizaciones';
import { getSupabaseServerClient } from '@/lib/supabase';
import {
  rowToConsulta,
  type Consulta,
  type ConsultaRow,
} from '@/types/consulta';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return (
      <PortalAutomatizaciones
        initialConsultas={[]}
        initialConfigured={false}
      />
    );
  }

  const { data, error } = await supabase
    .from('consultas')
    .select('*')
    .order('creado_en', { ascending: false });

  if (error) {
    return (
      <PortalAutomatizaciones
        initialConsultas={[]}
        initialConfigured={true}
        initialError={error.message}
      />
    );
  }

  const initialConsultas: Consulta[] = ((data ?? []) as ConsultaRow[]).map(
    rowToConsulta
  );

  return (
    <PortalAutomatizaciones
      initialConsultas={initialConsultas}
      initialConfigured={true}
    />
  );
}
