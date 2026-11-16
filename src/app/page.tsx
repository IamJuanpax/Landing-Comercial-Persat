'use client';

import { useEffect, useState } from 'react';
import PortalAutomatizaciones from '@/app/components/PortalAutomatizaciones';
import type { Consulta } from '@/types/consulta';

export default function HomePage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [configured, setConfigured] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const res = await fetch('/api/consultas', { cache: 'no-store' });
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok) {
          if (data.configured === false) {
            setConfigured(false);
          } else {
            setErrorMsg(data.error || 'Error al obtener consultas');
          }
          return;
        }

        setConsultas(data.consultas || []);
        setConfigured(true);
        setErrorMsg(null);
      } catch (err) {
        if (!isMounted) return;
        setErrorMsg(err instanceof Error ? err.message : 'Error al conectar con la API');
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PortalAutomatizaciones
      initialConsultas={consultas}
      initialConfigured={configured}
      initialError={errorMsg}
    />
  );
}
