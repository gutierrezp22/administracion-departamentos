import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import { TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import ResponsiveTable from "@/components/ResponsiveTable";
import LoadingOverlay from "@/components/LoadingOverlay";
import Pagination from "@/components/Pagination";
import DashboardMenu from "../index";
import withAuth from "@/components/withAut";
import Swal from "sweetalert2";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  FilterContainer,
  FilterInput,
  FilterSelect,
  EstadoFilter,
} from "@/components/Filters";
import { Badge, fmtFecha } from "@/components/ReportePlanta/ui";

interface Designacion {
  id: number;
  tipo: string;
  tipo_display: string;
  codigo_cargo: number | null;
  docente_detalle: { apellido: string; nombre: string; dni: string } | null;
  tipo_cargo_detalle: { denominacion: string; horas_semanales: number } | null;
  asignatura_detalle: { nombre: string } | null;
  expediente: string | null;
  nro_resolucion: string | null;
  dgpres: string | null;
  fecha_desde: string | null;
  fecha_hasta: string | null;
  fecha_vencimiento: string | null;
  vencimiento_estimado: boolean;
  en_tramite: boolean;
  renuncia_definitiva: boolean;
  estado: string;
}

const TIPOS = [
  { value: "", label: "Todos los trámites" },
  { value: "CON", label: "Concurso" },
  { value: "CON_INTERINO", label: "Concurso interino" },
  { value: "DI_GENUINO", label: "DI genuina" },
  { value: "DI_NO_GENUINO", label: "DI no genuina" },
  { value: "EA_POSITIVA", label: "EA positiva" },
  { value: "EA_NEGATIVA", label: "EA negativa" },
  { value: "PRORROGA_DI_GENUINO", label: "Prórroga DI genuina" },
  { value: "PRORROGA_DI_NO_GENUINO", label: "Prórroga DI no genuina" },
  { value: "PROR_70_ANIOS", label: "Prórroga 70 años" },
  { value: "PROR_CARGO_GESTION", label: "Prórroga cargo de gestión" },
  { value: "RENUNCIA", label: "Renuncia" },
  { value: "REINTEGRO", label: "Reintegro" },
  { value: "ALTA", label: "Alta de cargo" },
  { value: "BAJA", label: "Baja de cargo" },
];

const LIMITE = 15;

const ListaDesignaciones = () => {
  const router = useRouter();
  const [items, setItems] = useState<Designacion[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [enTramite, setEnTramite] = useState("");
  const [estado, setEstado] = useState("1");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      // Este endpoint usa paginación limit/offset (no page).
      const params: Record<string, string | number> = { limit: LIMITE, offset };
      // "todos" no es un valor de estado: se pide show_all para no filtrar.
      if (estado === "todos") params.show_all = "true";
      else if (estado) params.estado = estado;
      if (busqueda.trim()) params.search = busqueda.trim();
      if (tipo) params.tipo = tipo;
      if (enTramite) params.en_tramite = enTramite;

      const { data } = await API.get("/facet/designacion/", { params });
      setItems(data.results ?? []);
      setTotal(data.count ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setCargando(false);
    }
  }, [offset, estado, busqueda, tipo, enTramite]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Cualquier cambio de filtro vuelve a la primera página.
  useEffect(() => {
    setOffset(0);
  }, [busqueda, tipo, enTramite, estado]);

  const eliminar = async (d: Designacion) => {
    const r = await Swal.fire({
      title: "¿Dar de baja la designación?",
      text: "Queda inactiva, no se borra: el histórico se conserva.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Dar de baja",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!r.isConfirmed) return;
    try {
      await API.delete(`/facet/designacion/${d.id}/`);
      Swal.fire("Listo", "La designación quedó inactiva.", "success");
      cargar();
    } catch {
      Swal.fire("Error", "No se pudo dar de baja.", "error");
    }
  };

  const paginaActual = Math.floor(offset / LIMITE) + 1;
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE));

  const filtros = useMemo(
    () => (
      <FilterContainer onApply={cargar}>
        <FilterInput
          label="Buscar"
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Docente, DNI, expediente, DGPRES…"
          onEnterPress={cargar}
        />
        <FilterSelect
          label="Tipo de trámite"
          value={tipo}
          onChange={setTipo}
          options={TIPOS}
        />
        <FilterSelect
          label="En trámite"
          value={enTramite}
          onChange={setEnTramite}
          options={[
            { value: "", label: "Todas" },
            { value: "true", label: "Sólo en trámite" },
            { value: "false", label: "Sólo firmes" },
          ]}
        />
        <EstadoFilter value={estado} onChange={setEstado} />
      </FilterContainer>
    ),
    [busqueda, tipo, enTramite, estado, cargar]
  );

  return (
    <DashboardMenu>
      <div className="p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-blue-900">Designaciones</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Cada trámite que designa, prorroga, da de baja o cierra un cargo.
              El Reporte de Planta se calcula a partir de estos registros.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/designaciones/create")}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <AddIcon fontSize="small" /> Nueva designación
          </button>
        </div>

        {filtros}

        <div className="relative mt-4">
          {cargando && <LoadingOverlay variant="overlay" />}
          <ResponsiveTable dense>
            <TableHead>
              <TableRow>
                <TableCell>Docente</TableCell>
                <TableCell>Trámite</TableCell>
                <TableCell>Cód.</TableCell>
                <TableCell>Cargo</TableCell>
                <TableCell>Desde</TableCell>
                <TableCell>Vence</TableCell>
                <TableCell>Expediente</TableCell>
                <TableCell>DGPRES</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 && !cargando && (
                <TableRow>
                  <TableCell colSpan={10}>
                    <span className="text-sm text-gray-400 italic">
                      No hay designaciones que cumplan el filtro.
                    </span>
                  </TableCell>
                </TableRow>
              )}
              {items.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>
                    {d.docente_detalle
                      ? `${d.docente_detalle.apellido}, ${d.docente_detalle.nombre}`
                      : "—"}
                  </TableCell>
                  <TableCell>{d.tipo_display}</TableCell>
                  <TableCell>{d.codigo_cargo ?? "—"}</TableCell>
                  <TableCell>
                    {d.tipo_cargo_detalle?.denominacion ?? "—"}
                  </TableCell>
                  <TableCell>{fmtFecha(d.fecha_desde)}</TableCell>
                  <TableCell>
                    {fmtFecha(d.fecha_vencimiento)}
                    {d.vencimiento_estimado && (
                      <span
                        className="ml-1 text-amber-500"
                        title="Fecha estimada según la duración del tipo de trámite">
                        ≈
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{d.expediente ?? "—"}</TableCell>
                  <TableCell>{d.dgpres ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {d.en_tramite && <Badge tipo="tramite">trámite</Badge>}
                      {d.renuncia_definitiva && (
                        <Badge tipo="renuncia">definitiva</Badge>
                      )}
                      <Badge tipo={d.estado === "1" ? "vigente" : "cerrada"}>
                        {d.estado === "1" ? "activa" : "inactiva"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/designaciones/edit/${d.id}`)
                        }
                        title="Editar"
                        className="p-1 rounded hover:bg-blue-50 text-blue-600">
                        <EditIcon fontSize="small" />
                      </button>
                      <button
                        onClick={() => eliminar(d)}
                        title="Dar de baja"
                        className="p-1 rounded hover:bg-red-50 text-red-600">
                        <DeleteIcon fontSize="small" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ResponsiveTable>
        </div>

        <Pagination
          currentPage={paginaActual}
          totalPages={totalPaginas}
          hasPrevious={offset > 0}
          hasNext={offset + LIMITE < total}
          onPrevious={() => setOffset(Math.max(0, offset - LIMITE))}
          onNext={() => setOffset(offset + LIMITE)}
        />
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaDesignaciones);
