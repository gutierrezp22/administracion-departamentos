// Tipos del payload de GET /facet/reporte-planta/
// Espejan `departamentos/apis/reportePlanta.py`.

export interface Ocupacion {
  id: string;
  docente_id: number;
  docente: string;
  dni: string;
  legajo: string | null;
  estado_docente: string;
  codigo_cargo: number;
  tipo_cargo_id: number | null;
  denominacion: string;
  rango: string | null;
  dedicacion: string | null;
  horas_semanales: number;
  puntaje: number | null;
  estado: "vigente" | "licencia" | "cerrada";
  fecha_vencimiento: string | null;
  fuente_vencimiento: string | null;
  vencimiento_estimado: boolean;
  vencido: boolean;
  dias_para_vencer: number | null;
  fecha_alta: string | null;
  fecha_ultima_renovacion: string | null;
  tipo_ultima_designacion: string | null;
  tipo_ultima_designacion_display: string | null;
  anios_en_cargo: number | null;
  anios_desde_ultima_renovacion: number | null;
  cantidad_designaciones: number;
  tiene_prorroga_70: boolean;
  rol_gestion: string | null;
  en_tramite: boolean;
  renovacion_en_tramite: {
    id: number;
    tipo: string;
    fecha_desde: string | null;
    expediente: string | null;
  } | null;
  renuncia_definitiva: boolean;
  motivo_cierre: string | null;
  fecha_cierre: string | null;
  licencia_tipo: string | null;
  areas: string[];
  asignaturas: string[];
}

export interface DocenteFila {
  id: number;
  dni: string;
  cuil: string | null;
  legajo: string | null;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  email: string | null;
  sexo: string | null;
  titulo: string | null;
  fecha_nacimiento: string | null;
  edad: number | null;
  fecha_ingreso: string | null;
  antiguedad: number | null;
  estado_agente: string;
  acoop: boolean;
  observaciones: string | null;
  cargos_vigentes: number;
  cargos_totales: number;
  horas_semanales: number;
  puntaje: number;
  tiene_cargo_vencido: boolean;
  en_tramite: boolean;
  en_riesgo_edad: boolean;
  areas: string[];
  asignaturas: string[];
  sin_cargo: boolean;
}

export interface Resumen {
  docentes_activos: number;
  docentes_en_licencia: number;
  docentes_jubilados: number;
  docentes_inactivos: number;
  total_docentes: number;
  renuncias_definitivas: number;
  cargos_vigentes: number;
  cargos_totales: number;
  cargos_en_licencia: number;
  cargos_cerrados: number;
  cargos_vencidos: number;
  cargos_sin_vencimiento: number;
  horas_semanales: number;
  horas_promedio_por_docente: number;
  puntaje_total: number;
  docentes_en_riesgo_edad: number;
  total_asignaturas: number;
  seguimientos_abiertos: number;
  designaciones_en_tramite: number;
}

export interface Celda {
  vigente: number;
  vencido: number;
  renuncia: number;
}

export interface Distribucion {
  rangos: { clave: string; label: string }[];
  dedicaciones: { clave: string; label: string }[];
  celdas: Record<string, Record<string, Celda>>;
  total_por_rango: Record<string, number>;
  total_por_dedicacion: Record<string, number>;
  total: number;
}

export interface Vencimientos {
  buckets: Record<string, Ocupacion[]>;
  conteos: Record<string, number>;
  estimados: number;
  por_mes: { mes: string; cantidad: number }[];
}

export interface JubilacionFila {
  docente_id: number;
  docente: string;
  dni: string;
  edad: number;
  antiguedad: number | null;
  fecha_nacimiento: string | null;
  cumple_70: string | null;
  cumple_edad_critica: string | null;
  dias_para_70: number | null;
  horas_semanales: number;
  cargos: string[];
}

export interface Jubilacion {
  grupos: Record<string, JubilacionFila[]>;
  conteos: Record<string, number>;
  horas_en_riesgo: number;
  edad_promedio: number | null;
  piramide: { rango: string; cantidad: number }[];
}

export interface Renovacion {
  buckets: Record<string, Ocupacion[]>;
  conteos: Record<string, number>;
  promedio_anios: number | null;
}

export interface TramiteFila {
  id: number;
  docente: string;
  docente_id: number;
  tipo: string;
  tipo_display: string;
  codigo_cargo: number | null;
  denominacion: string | null;
  expediente: string | null;
  nro_resolucion: string | null;
  dgpres: string | null;
  fecha_desde: string | null;
  fecha_hasta: string | null;
  dias_en_tramite: number | null;
  observaciones: string | null;
}

export interface Tramites {
  en_tramite: TramiteFila[];
  sin_instrumento: TramiteFila[];
  sin_dgpres: TramiteFila[];
  conteos: Record<string, number>;
}

export interface CoberturaFila {
  asignatura_id: number;
  asignatura: string;
  codigo: string;
  codigo_siu: string | null;
  conciliada_siu: boolean;
  area: string | null;
  docentes: number;
  critica: boolean;
  sin_cobertura: boolean;
  inscriptos: number;
  anio_matricula: number | null;
  inscriptos_por_docente: number | null;
}

export interface Cobertura {
  asignaturas: CoberturaFila[];
  conteos: Record<string, number>;
}

export interface MesCumple {
  mes: number;
  nombre: string;
  docentes: {
    docente: string;
    dia: number;
    mes: number;
    edad: number | null;
    email: string | null;
  }[];
}

export interface DesignacionesResumen {
  total: number;
  por_tipo: { tipo: string; cantidad: number }[];
  por_anio: { anio: number; cantidad: number }[];
  por_instrumento: { instrumento: string; cantidad: number }[];
}

export interface SeguimientoFila {
  id: number;
  docente_id: number;
  docente: string;
  tipo: string;
  tipo_display: string;
  descripcion: string;
  fecha_novedad: string;
  fecha_resolucion: string | null;
  responsable: string | null;
  prioridad: string;
  estado_seguimiento: string;
  abierto: boolean;
}

export interface Seguimientos {
  items: SeguimientoFila[];
  conteos: Record<string, number>;
  por_tipo: { tipo: string; cantidad: number }[];
  por_responsable: { responsable: string; cantidad: number }[];
}

export interface AreaFila {
  area: string;
  horas: number;
  cargos: number;
  puntaje: number;
  docentes: number;
  por_rango: Record<string, number>;
}

export interface DedicacionPorArea {
  areas: AreaFila[];
  posibles_duplicados: { a: string; b: string }[];
  areas_sin_cargos: string[];
}

export interface Alerta {
  nivel: "critico" | "alto" | "medio" | "bajo";
  titulo: string;
  detalle: string;
  tablero: string;
}

export interface ReportePlanta {
  generado: string;
  parametros: {
    departamento: number | null;
    edad_critica: number;
    cobertura_minima: number;
    horizonte_dias: number;
  };
  resumen: Resumen;
  distribucion: Distribucion;
  docentes: DocenteFila[];
  ocupaciones: Ocupacion[];
  vencimientos: Vencimientos;
  jubilacion: Jubilacion;
  renovacion: Renovacion;
  tramites: Tramites;
  cobertura: Cobertura;
  cumpleanos: MesCumple[];
  designaciones_resumen: DesignacionesResumen;
  seguimientos: Seguimientos;
  dedicacion_por_area: DedicacionPorArea;
  alertas: Alerta[];
}
