'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  AUTORES,
  ESTADO_LABEL,
  ESTADOS,
  VERTICAL_LABEL,
  type Consulta,
  type EstadoConsulta,
  type Vertical,
} from '@/types/consulta';

const STORAGE_KEY = 'persat_portal_automatizaciones_v1';
const DRAFT_KEY = `${STORAGE_KEY}_draft`;
const THEME_KEY = `${STORAGE_KEY}_theme`;

interface PortalAutomatizacionesProps {
  initialConsultas: Consulta[];
  initialConfigured: boolean;
  initialError?: string | null;
}

interface DraftState {
  vertical: Vertical;
  pregunta: string;
  tipoDeal: string;
  descripcion: string;
  deal: string;
  autor: string;
}

const EMPTY_FORM: DraftState = {
  vertical: 'tecnicos',
  pregunta: '',
  tipoDeal: '',
  descripcion: '',
  deal: '',
  autor: '',
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ' · ' +
    d.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

export default function PortalAutomatizaciones({
  initialConsultas,
  initialConfigured,
  initialError = null,
}: PortalAutomatizacionesProps) {
  const [items, setItems] = useState<Consulta[]>(initialConsultas);
  const [dbConfigured, setDbConfigured] = useState<boolean>(initialConfigured);
  const [dbError, setDbError] = useState<string | null>(initialError);

  // Sincronizar el estado cuando initialConsultas cambie (ej. al cargar desde la API)
  useEffect(() => {
    setItems(initialConsultas);
  }, [initialConsultas]);

  useEffect(() => {
    setDbConfigured(initialConfigured);
  }, [initialConfigured]);

  useEffect(() => {
    setDbError(initialError);
  }, [initialError]);

  const [form, setForm] = useState<DraftState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [filtroVertical, setFiltroVertical] = useState<'todas' | Vertical>('todas');
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroAutor, setFiltroAutor] = useState('');

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [shareItem, setShareItem] = useState<Consulta | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const preguntaRef = useRef<HTMLTextAreaElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  };

  // Inicializar tema, borrador local y limpiar timer al desmontar
  useEffect(() => {
    setMounted(true);

    try {
      const currentAttr = document.documentElement.getAttribute('data-theme');
      if (currentAttr === 'dark' || currentAttr === 'light') {
        setTheme(currentAttr);
      } else {
        const stored = localStorage.getItem(THEME_KEY);
        const resolved =
          stored === 'dark' || stored === 'light'
            ? stored
            : window.matchMedia &&
                window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';
        document.documentElement.setAttribute('data-theme', resolved);
        setTheme(resolved);
      }
    } catch {
      // Ignorar errores de almacenamiento
    }

    try {
      const rawDraft = localStorage.getItem(DRAFT_KEY);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft) as Partial<DraftState>;
        setForm({
          vertical:
            parsed.vertical === 'tecnicos' ||
            parsed.vertical === 'vendedores' ||
            parsed.vertical === 'logistica'
              ? parsed.vertical
              : 'tecnicos',
          pregunta: parsed.pregunta ?? '',
          tipoDeal: parsed.tipoDeal ?? '',
          descripcion: parsed.descripcion ?? '',
          deal: parsed.deal ?? '',
          autor: parsed.autor ?? '',
        });
      }
    } catch {
      // Ignorar errores de borrador
    }

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Guardar borrador automáticamente mientras no se esté editando
  useEffect(() => {
    if (!mounted || editId) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [form, editId, mounted]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      // Ignorar errores de almacenamiento
    }
  };

  const counts = useMemo(() => {
    const c = { tecnicos: 0, vendedores: 0, logistica: 0 };
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item && item.vertical && c[item.vertical] !== undefined) {
          c[item.vertical]++;
        }
      }
    }
    return { total: Array.isArray(items) ? items.length : 0, ...c };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) => filtroVertical === 'todas' || i.vertical === filtroVertical)
      .filter((i) => !filtroEstado || i.estado === filtroEstado)
      .filter((i) => !filtroAutor || i.autor === filtroAutor)
      .filter(
        (i) =>
          !q ||
          [i.pregunta, i.descripcion, i.tipoDeal, i.deal, i.autor]
            .join(' ')
            .toLowerCase()
            .includes(q)
      )
      .sort((a, b) => b.creado - a.creado);
  }, [items, filtroVertical, filtroEstado, filtroAutor, search]);

  const resetForm = (preserveAutor = '') => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, autor: preserveAutor });
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignorar errores de almacenamiento
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      vertical: form.vertical,
      pregunta: form.pregunta.trim(),
      tipoDeal: form.tipoDeal,
      descripcion: form.descripcion.trim(),
      deal: form.deal.trim(),
      autor: form.autor.trim(),
    };

    if (
      !payload.pregunta ||
      !payload.tipoDeal.trim() ||
      !payload.descripcion ||
      !payload.autor
    ) {
      showToast('Completá los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        const res = await fetch(`/api/consultas/${encodeURIComponent(editId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          consulta?: Consulta;
          error?: string;
          configured?: boolean;
        };

        if (!res.ok || !data.consulta) {
          if (data.configured === false) setDbConfigured(false);
          showToast(data.error || 'No se pudo actualizar la consulta');
          return;
        }

        setItems((prev) =>
          prev.map((item) => (item.id === editId ? data.consulta! : item))
        );
        setDbConfigured(true);
        setDbError(null);
        resetForm(payload.autor);
        showToast('Consulta actualizada');
      } else {
        const res = await fetch('/api/consultas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          consulta?: Consulta;
          error?: string;
          configured?: boolean;
        };

        if (!res.ok || !data.consulta) {
          if (data.configured === false) setDbConfigured(false);
          showToast(data.error || 'No se pudo cargar la consulta');
          return;
        }

        setItems((prev) => [data.consulta!, ...prev]);
        setDbConfigured(true);
        setDbError(null);
        // Recordar el nombre para la próxima carga
        resetForm(payload.autor);
        showToast('Consulta cargada');
      }
    } catch {
      showToast('Error de conexión con el servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEstado = async (item: Consulta, nextEstado: EstadoConsulta) => {
    if (item.estado === nextEstado) return;
    const previousEstado = item.estado;

    // Actualización optimista
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, estado: nextEstado } : x))
    );

    try {
      const res = await fetch(`/api/consultas/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nextEstado }),
      });
      const data = (await res.json()) as {
        consulta?: Consulta;
        error?: string;
        configured?: boolean;
      };

      if (!res.ok || !data.consulta) {
        if (data.configured === false) setDbConfigured(false);
        setItems((prev) =>
          prev.map((x) =>
            x.id === item.id ? { ...x, estado: previousEstado } : x
          )
        );
        showToast(data.error || 'No se pudo cambiar el estado');
        return;
      }

      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? data.consulta! : x))
      );
      showToast(`Estado: ${ESTADO_LABEL[nextEstado]}`);
    } catch {
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id ? { ...x, estado: previousEstado } : x
        )
      );
      showToast('Error de conexión con el servidor');
    }
  };

  const getShareText = (item: Consulta) => {
    return `Hola equipo,\n\nLes comparto la consulta de automatización registrada en el portal:\n\n• Vertical: ${VERTICAL_LABEL[item.vertical]}\n• Tipo de Deal / Contexto: ${item.tipoDeal}${item.deal ? '\n• Deal / Cliente: ' + item.deal : ''}\n• Solicitado por: ${item.autor || 'Sin especificar'}\n• Estado actual: ${ESTADO_LABEL[item.estado]}\n\nPREGUNTA:\n${item.pregunta}\n\nDESCRIPCIÓN DE LO IMAGINADO:\n${item.descripcion}\n\n---\nPortal de Automatizaciones · Persat`;
  };

  const handleCopyModalText = async (text: string) => {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard no disponible');
      }
      await navigator.clipboard.writeText(text);
      showToast('¡Texto copiado para Gmail!');
    } catch {
      showToast('No se pudo copiar');
    }
  };

  const handleDelete = async (item: Consulta) => {
    if (!window.confirm('¿Eliminar esta consulta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await fetch(`/api/consultas/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        configured?: boolean;
      };

      if (!res.ok) {
        if (data.configured === false) setDbConfigured(false);
        showToast(data.error || 'No se pudo eliminar la consulta');
        return;
      }

      setItems((prev) => prev.filter((x) => x.id !== item.id));
      if (editId === item.id) {
        resetForm();
      }
      showToast('Consulta eliminada');
    } catch {
      showToast('Error de conexión con el servidor');
    }
  };

  const handleEdit = (item: Consulta) => {
    setEditId(item.id);
    setForm({
      vertical: item.vertical,
      pregunta: item.pregunta,
      tipoDeal: item.tipoDeal,
      descripcion: item.descripcion,
      deal: item.deal,
      autor: item.autor,
    });

    requestAnimationFrame(() => {
      preguntaRef.current?.focus();
      if (formRef.current) {
        const top =
          formRef.current.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  };

  const handleCopy = async (item: Consulta) => {
    const txt = `Vertical: ${VERTICAL_LABEL[item.vertical]}\nTipo de deal: ${item.tipoDeal}${item.deal ? '\nDeal: ' + item.deal : ''}\n\nPregunta:\n${item.pregunta}\n\nLo imaginado para este deal:\n${item.descripcion}${item.autor ? '\n\nSolicitado por: ' + item.autor : ''}`;
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard no disponible');
      }
      await navigator.clipboard.writeText(txt);
      showToast('Consulta copiada');
    } catch {
      showToast('No se pudo copiar');
    }
  };

  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="brand">
            <img
              src="/persat-logo.png"
              alt="Persat IA"
              className="brand-logo"
            />
            <div>
              Persat <small>Portal Comercial</small>
            </div>
          </div>
          <div className="top-actions">
            <button
              type="button"
              className="btn btn-ghost theme-btn"
              onClick={toggleTheme}
              title="Cambiar modo claro / oscuro"
              aria-label="Cambiar modo claro / oscuro"
            >
              <svg
                className="i-moon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
              </svg>
              <svg
                className="i-sun"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
              <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="wrap">
          <div className="hero-card">
            <span className="eyebrow">Exclusivo área comercial</span>
            <h1>
              Portal de <em>automatizaciones</em> para el servidor
            </h1>
            <p>
              Centralizá las ideas de automatización que surgen en cada deal.
              Cargá la consulta, indicá la vertical y el tipo de negocio, y
              describí cómo te imaginás la solución.
            </p>
            <div className="stats">
              <div className="stat">
                <b>{counts.total}</b>
                <span>Consultas totales</span>
              </div>
              <div className="stat">
                <b>{counts.tecnicos}</b>
                <span>Técnicos</span>
              </div>
              <div className="stat">
                <b>{counts.vendedores}</b>
                <span>Vendedores</span>
              </div>
              <div className="stat">
                <b>{counts.logistica}</b>
                <span>Logística</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="wrap grid">
        <aside className="panel sticky">
          <h2>{editId ? 'Editar consulta' : 'Nueva consulta'}</h2>
          <p className="sub">
            Los campos con <span style={{ color: 'var(--orange)' }}>*</span> son
            obligatorios.
          </p>

          <form ref={formRef} onSubmit={handleSubmit} autoComplete="off">
            <div className="field">
              <label className="f">
                Vertical <span className="req">*</span>
              </label>
              <div className="seg">
                <input
                  type="radio"
                  name="vertical"
                  id="vTec"
                  value="tecnicos"
                  checked={form.vertical === 'tecnicos'}
                  onChange={() => setForm({ ...form, vertical: 'tecnicos' })}
                />
                <label htmlFor="vTec">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5z" />
                  </svg>
                  Técnicos
                </label>

                <input
                  type="radio"
                  name="vertical"
                  id="vVen"
                  value="vendedores"
                  checked={form.vertical === 'vendedores'}
                  onChange={() => setForm({ ...form, vertical: 'vendedores' })}
                />
                <label htmlFor="vVen">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" />
                  </svg>
                  Vendedores
                </label>

                <input
                  type="radio"
                  name="vertical"
                  id="vLog"
                  value="logistica"
                  checked={form.vertical === 'logistica'}
                  onChange={() => setForm({ ...form, vertical: 'logistica' })}
                />
                <label htmlFor="vLog">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  Logística
                </label>
              </div>
            </div>

            <div className="field">
              <label className="f" htmlFor="pregunta">
                Pregunta <span className="req">*</span>
              </label>
              <textarea
                ref={preguntaRef}
                id="pregunta"
                rows={3}
                placeholder="Ej.: ¿Podemos enviar automáticamente el remito al cliente cuando el chofer cierra la entrega?"
                required
                value={form.pregunta}
                onChange={(e) => setForm({ ...form, pregunta: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="f" htmlFor="tipoDeal">
                Tipo de deal <span className="req">*</span>
              </label>
              <textarea
                id="tipoDeal"
                rows={3}
                placeholder="Contexto del deal: rubro, qué hace la empresa, cómo opera y en qué etapa está. Ej.: distribuidora de bebidas con 12 choferes, reparte a almacenes del GBA; en prueba de valor."
                required
                value={form.tipoDeal}
                onChange={(e) => setForm({ ...form, tipoDeal: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="f" htmlFor="descripcion">
                Descripción de lo imaginado para este deal{' '}
                <span className="req">*</span>
              </label>
              <textarea
                id="descripcion"
                rows={5}
                placeholder="Disparador, qué datos intervienen, qué debería pasar y qué resultado espera el cliente."
                required
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
              />
            </div>

            <div className="row2">
              <div className="field">
                <label className="f" htmlFor="deal">
                  Deal / cliente <span className="hint">(opcional)</span>
                </label>
                <input
                  type="text"
                  id="deal"
                  placeholder="Nombre o link de HubSpot"
                  value={form.deal}
                  onChange={(e) => setForm({ ...form, deal: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="f" htmlFor="autor">
                  Quién hizo la pregunta <span className="req">*</span>
                </label>
                <select
                  id="autor"
                  required
                  value={form.autor}
                  onChange={(e) => setForm({ ...form, autor: e.target.value })}
                >
                  <option value="">Seleccionar…</option>
                  {AUTORES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>
                  {saving
                    ? 'Guardando…'
                    : editId
                      ? 'Guardar cambios'
                      : 'Cargar consulta'}
                </span>
              </button>

              {editId && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => resetForm()}
                  disabled={saving}
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="saved-note">
              <span className={`dot${dbConfigured ? '' : ' warn'}`}></span>
              {dbConfigured
                ? 'Se guarda automáticamente en Supabase.'
                : 'Falta conectar Supabase (ver GUIA-SUPABASE.md).'}
            </div>
          </form>
        </aside>

        <section className="list-col">
          {!dbConfigured && (
            <div className="warn-storage">
              La base de datos Supabase aún no está configurada. Seguí los pasos
              de <strong>GUIA-SUPABASE.md</strong> y creá{' '}
              <code>.env.local</code> para guardar y listar consultas.
            </div>
          )}

          {dbConfigured && dbError && (
            <div className="warn-storage">
              Error al conectar con Supabase: {dbError}. Verificá que ejecutaste{' '}
              <code>supabase/schema.sql</code> y que las variables de entorno
              sean correctas.
            </div>
          )}

          <div className="toolbar">
            <div className="tabs">
              <button
                type="button"
                className={`tab${filtroVertical === 'todas' ? ' active' : ''}`}
                onClick={() => setFiltroVertical('todas')}
              >
                Todas <span className="n">{counts.total}</span>
              </button>
              <button
                type="button"
                className={`tab${filtroVertical === 'tecnicos' ? ' active' : ''}`}
                onClick={() => setFiltroVertical('tecnicos')}
              >
                Técnicos <span className="n">{counts.tecnicos}</span>
              </button>
              <button
                type="button"
                className={`tab${filtroVertical === 'vendedores' ? ' active' : ''}`}
                onClick={() => setFiltroVertical('vendedores')}
              >
                Vendedores <span className="n">{counts.vendedores}</span>
              </button>
              <button
                type="button"
                className={`tab${filtroVertical === 'logistica' ? ' active' : ''}`}
                onClick={() => setFiltroVertical('logistica')}
              >
                Logística <span className="n">{counts.logistica}</span>
              </button>
            </div>

            <div className="filters">
              <input
                type="text"
                placeholder="Buscar en consultas… (ej. chofer, HubSpot)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                aria-label="Filtrar por estado"
              >
                <option value="">Todos los estados</option>
                {ESTADOS.map((est) => (
                  <option key={est} value={est}>
                    {ESTADO_LABEL[est]}
                  </option>
                ))}
              </select>
              <select
                value={filtroAutor}
                onChange={(e) => setFiltroAutor(e.target.value)}
                aria-label="Filtrar por persona"
              >
                <option value="">Todas las personas</option>
                {AUTORES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              {(search || filtroEstado || filtroAutor || filtroVertical !== 'todas') && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => {
                    setSearch('');
                    setFiltroEstado('');
                    setFiltroAutor('');
                    setFiltroVertical('todas');
                  }}
                  title="Limpiar filtros"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="list">
            {filteredItems.length === 0 ? (
              items.length > 0 ? (
                <div className="empty">
                  <b>Sin resultados</b>
                  Probá con otra vertical, estado o búsqueda.
                </div>
              ) : (
                <div className="empty">
                  <b>Todavía no hay consultas</b>
                  Cargá la primera desde el formulario.
                </div>
              )
            ) : (
              filteredItems.map((item) => (
                <article key={item.id} className={`card v-${item.vertical}`}>
                  <div className="card-head">
                    <div className="badges">
                      <span className="badge">
                        {VERTICAL_LABEL[item.vertical] || item.vertical}
                      </span>
                      {item.deal && (
                        <span className="badge grey">{item.deal}</span>
                      )}
                    </div>
                    
                    {/* Lista desplegable para el estado */}
                    <div className="status-select-wrap">
                      <select
                        className={`status-select st-${item.estado}`}
                        value={item.estado}
                        onChange={(e) =>
                          handleUpdateEstado(item, e.target.value as EstadoConsulta)
                        }
                        title="Cambiar estado de la consulta"
                      >
                        {ESTADOS.map((st) => (
                          <option key={st} value={st}>
                            {ESTADO_LABEL[st]}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="status-select-arrow"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  <h3>{item.pregunta}</h3>

                  <p className="lbl">Tipo de deal</p>
                  <p className="desc ctx">{item.tipoDeal}</p>

                  <p className="lbl" style={{ marginTop: 12 }}>
                    Lo imaginado para este deal
                  </p>
                  <p className="desc">{item.descripcion}</p>

                  <div className="card-foot">
                    <span className="meta">
                      {item.autor ? `${item.autor} · ` : ''}
                      {mounted ? formatDate(item.creado) : ''}
                      {item.editado ? ' · editada' : ''}
                    </span>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setShareItem(item)}
                        title="Ver y copiar texto para enviar por Gmail"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        Gmail
                      </button>

                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => handleCopy(item)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                        Copiar
                      </button>

                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => handleEdit(item)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
                        </svg>
                        Editar
                      </button>

                      <button
                        type="button"
                        className="icon-btn del"
                        onClick={() => handleDelete(item)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      <footer>
        Persat · Portal interno del área comercial · Consultas almacenadas en
        Supabase
      </footer>

      {/* Modal para copiar texto y compartir en Gmail */}
      {shareItem && (
        <div
          className="modal-backdrop"
          onClick={() => setShareItem(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Compartir por Gmail
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShareItem(null)}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <p className="modal-sub">
              Copiá este mensaje preformateado para pegarlo directamente en tu correo de Gmail:
            </p>

            <textarea
              className="modal-textarea"
              readOnly
              rows={9}
              value={getShareText(shareItem)}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShareItem(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleCopyModalText(getShareText(shareItem));
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copiar texto
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toastMsg}</div>
    </>
  );
}
