export type Vertical = 'tecnicos' | 'vendedores' | 'logistica';

export type EstadoConsulta = 'pendiente' | 'analisis' | 'resuelta' | 'descartada';

export interface Consulta {
  id: string;
  vertical: Vertical;
  pregunta: string;
  tipoDeal: string;
  descripcion: string;
  deal: string;
  autor: string;
  estado: EstadoConsulta;
  creado: number;
  editado?: number | null;
}

export interface ConsultaRow {
  id: string;
  vertical: string;
  pregunta: string;
  tipo_deal: string;
  descripcion: string;
  deal: string | null;
  autor: string;
  estado: string;
  creado_en: string;
  editado_en: string | null;
}

export const VERTICALES: Vertical[] = ['tecnicos', 'vendedores', 'logistica'];

export const VERTICAL_LABEL: Record<Vertical, string> = {
  tecnicos: 'Técnicos',
  vendedores: 'Vendedores',
  logistica: 'Logística',
};

export const ESTADOS: EstadoConsulta[] = [
  'pendiente',
  'analisis',
  'resuelta',
  'descartada',
];

export const ESTADO_LABEL: Record<EstadoConsulta, string> = {
  pendiente: 'Pendiente',
  analisis: 'En análisis',
  resuelta: 'Resuelta',
  descartada: 'Descartada',
};

export const AUTORES = [
  'Joel',
  'Leo',
  'Gian',
  'Juanpa',
  'Jero',
  'Lucho',
  'Hugo',
] as const;

export function isValidVertical(value: unknown): value is Vertical {
  return typeof value === 'string' && (VERTICALES as string[]).includes(value);
}

export function isValidEstado(value: unknown): value is EstadoConsulta {
  return typeof value === 'string' && (ESTADOS as string[]).includes(value);
}

export function rowToConsulta(row: ConsultaRow): Consulta {
  return {
    id: row.id,
    vertical: isValidVertical(row.vertical) ? row.vertical : 'tecnicos',
    pregunta: row.pregunta,
    tipoDeal: row.tipo_deal,
    descripcion: row.descripcion,
    deal: row.deal ?? '',
    autor: row.autor,
    estado: isValidEstado(row.estado) ? row.estado : 'pendiente',
    creado: new Date(row.creado_en).getTime(),
    editado: row.editado_en ? new Date(row.editado_en).getTime() : null,
  };
}
