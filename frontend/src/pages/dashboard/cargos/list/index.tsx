import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
} from "@mui/material";
import ResponsiveTable from "@/components/ResponsiveTable";
import LoadingOverlay from "@/components/LoadingOverlay";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import ActionMenu from "@/components/ActionMenu";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import DashboardMenu from "../..";
import withAuth from "@/components/withAut";
import {
  FilterContainer,
  FilterInput,
  FilterSelect,
  FilterDatePicker,
  EstadoFilter,
} from "@/components/Filters";
import DescomponerModal from "@/components/Cargos/DescomponerModal";
import CombinarModal from "@/components/Cargos/CombinarModal";
import VincularModal from "@/components/Cargos/VincularModal";

const normalizeUrl = (url: string) => {
  return url.replace(window.location.origin, "").replace(/^\/+/, "/");
};

const formatFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return "—";
  const d = dayjs(fecha);
  return d.isValid() ? d.format("DD/MM/YYYY") : "—";
};

interface Cargo {
  id: number;
  numero_de_cargo: number;
  tipo_cargo: number | null;
  tipo_cargo_detalle: {
    id: number;
    sigla: string;
    descripcion: string;
    dedicacion: string;
    puntaje: string | null;
  } | null;
  departamento: number | null;
  departamento_detalle: { id: number; nombre: string } | null;
  asignatura: number | null;
  asignatura_detalle: { id: number; nombre: string; codigo: string } | null;
  resolucion_oficializacion: number | null;
  resolucion_oficializacion_detalle: {
    id: number;
    nresolucion: string;
    nexpediente: string;
    fecha: string | null;
  } | null;
  puntaje: string | null;
  estado: string;
  ocupacion_actual: {
    id: number;
    fecha_inicio: string;
    fecha_fin: string | null;
    vigente: boolean;
    rol: "docente" | "no_docente" | null;
    ocupante: {
      id: number;
      nombre: string;
      apellido: string;
      dni: string;
      legajo: string | null;
    } | null;
    vacante: boolean;
  } | null;
}

interface TipoCargoOpt {
  id: number;
  descripcion: string;
  dedicacion: string;
}

const DEDICACION_OPTIONS = [
  { value: "SIMP", label: "Simple" },
  { value: "SEMI", label: "Semi (Part-Time)" },
  { value: "EXCL", label: "Exclusiva (Full-Time)" },
  { value: "35HS", label: "35 Horas" },
];

const ListaCargos = () => {
  const router = useRouter();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [filtroNumero, setFiltroNumero] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [filtroDedicacion, setFiltroDedicacion] = useState("");
  const [filtroDescripcion, setFiltroDescripcion] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  // Default: solo vinculados. Los huérfanos viven en /cargos/sin-vincular.
  const [filtroVinculacion, setFiltroVinculacion] = useState<string>("vinculados");
  const [totalPendientes, setTotalPendientes] = useState<number>(0);
  const [fechaAltaDesde, setFechaAltaDesde] = useState("");
  const [fechaAltaHasta, setFechaAltaHasta] = useState("");
  const [fechaBajaDesde, setFechaBajaDesde] = useState("");
  const [fechaBajaHasta, setFechaBajaHasta] = useState("");
  const [descripcionOptions, setDescripcionOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [departamentoOptions, setDepartamentoOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    "/facet/cargo/?estado=1&departamento__isnull=False"
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [openDescomponer, setOpenDescomponer] = useState<Cargo | null>(null);
  const [openCombinar, setOpenCombinar] = useState(false);
  const [openVincular, setOpenVincular] = useState<Cargo | null>(null);

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    // Cargar descripciones únicas para el filtro
    const fetchTipos = async () => {
      try {
        const r = await API.get(`/facet/tipo-cargo/?page_size=100`);
        const tipos: TipoCargoOpt[] = r.data.results || [];
        const set = new Set<string>();
        tipos.forEach((t) => set.add(t.descripcion));
        setDescripcionOptions(
          Array.from(set).sort().map((d) => ({ value: d, label: d }))
        );
      } catch (e) {
        console.error("Error cargando tipos:", e);
      }
    };
    const fetchDeptos = async () => {
      try {
        const r = await API.get(`/facet/departamento/?page_size=100`);
        const deptos = r.data.results || [];
        setDepartamentoOptions(
          deptos.map((d: { id: number; nombre: string }) => ({
            value: String(d.id),
            label: d.nombre,
          }))
        );
      } catch (e) {
        console.error("Error cargando departamentos:", e);
      }
    };
    fetchTipos();
    fetchDeptos();

    // Conteo de pendientes para mostrar banner si hay cargos sin vincular
    const fetchPendientes = async () => {
      try {
        const r = await API.get(
          "/facet/cargo/?departamento__isnull=True&estado=1&page_size=1"
        );
        setTotalPendientes(r.data.count ?? 0);
      } catch {
        // ignore
      }
    };
    fetchPendientes();
  }, []);

  const fetchData = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await API.get(url);
      setCargos(response.data.results);
      setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrl(response.data.previous ? normalizeUrl(response.data.previous) : null);
      setTotalItems(response.data.count);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Swal.fire({ icon: "error", title: "Error", text: "Error al obtener cargos." });
    }
  };

  const buildParams = (page = 1): URLSearchParams => {
    const params = new URLSearchParams();
    if (filtroNumero) params.append("numero_de_cargo__icontains", filtroNumero);
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado) {
      params.append("estado", filtroEstado);
    }
    if (filtroDedicacion) params.append("tipo_cargo__dedicacion", filtroDedicacion);
    if (filtroDescripcion) params.append("tipo_cargo__descripcion", filtroDescripcion);
    if (filtroDepartamento) params.append("departamento", filtroDepartamento);
    if (filtroVinculacion === "sin_vincular") params.append("departamento__isnull", "True");
    if (filtroVinculacion === "vinculados") params.append("departamento__isnull", "False");
    if (fechaAltaDesde) params.append("fecha_alta_desde", fechaAltaDesde);
    if (fechaAltaHasta) params.append("fecha_alta_hasta", fechaAltaHasta);
    if (fechaBajaDesde) params.append("fecha_baja_desde", fechaBajaDesde);
    if (fechaBajaHasta) params.append("fecha_baja_hasta", fechaBajaHasta);
    params.append("page", page.toString());
    return params;
  };

  const filtrar = () => {
    setCurrentPage(1);
    setCurrentUrl(`/facet/cargo/?${buildParams(1).toString()}`);
  };

  const limpiarFiltros = () => {
    setFiltroNumero("");
    setFiltroEstado("1");
    setFiltroDedicacion("");
    setFiltroDescripcion("");
    setFiltroDepartamento("");
    setFiltroVinculacion("vinculados");
    setFechaAltaDesde("");
    setFechaAltaHasta("");
    setFechaBajaDesde("");
    setFechaBajaHasta("");
    setCurrentUrl("/facet/cargo/?estado=1&departamento__isnull=False");
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setCurrentUrl(`/facet/cargo/?${buildParams(newPage).toString()}`);
  };

  const eliminar = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Se marcará el cargo como inactivo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/facet/cargo/${id}/`);
      Swal.fire("Eliminado!", "El cargo fue desactivado.", "success");
      fetchData(currentUrl);
    } catch (error) {
      Swal.fire("Error!", "No se pudo eliminar.", "error");
    }
  };

  const renovar = async (cargo: Cargo) => {
    if (!cargo.tipo_cargo) {
      Swal.fire("No se puede", "Este cargo no tiene tipo asignado.", "warning");
      return;
    }
    const { value: confirmed } = await Swal.fire({
      title: "Renovar cargo",
      text: `Se creará un nuevo cargo del mismo tipo (${cargo.tipo_cargo_detalle?.descripcion}) y se marcará el original como inactivo.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Renovar",
      cancelButtonText: "Cancelar",
    });
    if (!confirmed) return;
    try {
      const r = await API.post(`/facet/cargo/${cargo.id}/renovar/`, {});
      const nuevo = r.data.cargos_destino?.[0];
      Swal.fire(
        "Renovado",
        `Nuevo cargo: #${nuevo?.numero_de_cargo}`,
        "success"
      );
      fetchData(currentUrl);
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.detail || "No se pudo renovar.", "error");
    }
  };

  const toggleSeleccion = (id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const seleccionadosCargos = cargos.filter((c) => seleccionados.has(c.id));
  const sumaPuntajesSeleccionados = seleccionadosCargos.reduce(
    (acc, c) => acc + Number(c.puntaje || 0),
    0
  );

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Cargos</h1>
          </div>

          <div className="p-6">
            {totalPendientes > 0 && (
              <div
                onClick={() => router.push("/dashboard/cargos/sin-vincular")}
                className="flex items-center justify-between gap-3 mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 text-white rounded-lg">
                    <LinkOffIcon fontSize="small" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-orange-900">
                      Hay {totalPendientes} cargo{totalPendientes === 1 ? "" : "s"} sin vincular
                    </p>
                    <p className="text-xs text-orange-700">
                      Estos cargos esperan que les asignes departamento. Hacé click para resolverlos.
                    </p>
                  </div>
                </div>
                <span className="text-orange-700 font-semibold text-sm">Resolver →</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => router.push("/dashboard/cargos/create")}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-semibold text-sm">
                <AddIcon /> Agregar Cargo
              </button>
              <button
                onClick={() => setOpenCombinar(true)}
                disabled={seleccionados.size < 2}
                className={`flex items-center gap-2 px-4 py-2 rounded-md shadow-md transition-colors duration-200 ${
                  seleccionados.size >= 2
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}>
                <MergeTypeIcon /> Combinar seleccionados ({seleccionados.size})
              </button>
              {seleccionados.size > 0 && (
                <div className="flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-900">
                  Suma de puntajes seleccionados: <strong className="ml-1">{sumaPuntajesSeleccionados.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <FilterContainer onApply={filtrar} onClear={limpiarFiltros}>
              <FilterInput
                label="Número de cargo"
                value={filtroNumero}
                onChange={setFiltroNumero}
                placeholder="Buscar por número"
              />
              <FilterSelect
                label="Categoría / Descripción"
                value={filtroDescripcion}
                onChange={setFiltroDescripcion}
                options={descripcionOptions}
                placeholder="Todas las categorías"
              />
              <FilterSelect
                label="Dedicación"
                value={filtroDedicacion}
                onChange={setFiltroDedicacion}
                options={DEDICACION_OPTIONS}
                placeholder="Todas las dedicaciones"
              />
              <FilterSelect
                label="Departamento"
                value={filtroDepartamento}
                onChange={setFiltroDepartamento}
                options={departamentoOptions}
                placeholder="Todos los departamentos"
              />
              <FilterSelect
                label="Vinculación"
                value={filtroVinculacion}
                onChange={setFiltroVinculacion}
                options={[
                  { value: "vinculados", label: "Solo vinculados" },
                  { value: "sin_vincular", label: "Sin vincular" },
                ]}
                placeholder="Todos"
              />
              <EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
              <FilterDatePicker
                label="Fecha alta desde"
                value={fechaAltaDesde}
                onChange={setFechaAltaDesde}
              />
              <FilterDatePicker
                label="Fecha alta hasta"
                value={fechaAltaHasta}
                onChange={setFechaAltaHasta}
              />
              <FilterDatePicker
                label="Fecha baja desde"
                value={fechaBajaDesde}
                onChange={setFechaBajaDesde}
              />
              <FilterDatePicker
                label="Fecha baja hasta"
                value={fechaBajaHasta}
                onChange={setFechaBajaHasta}
              />
            </FilterContainer>

            <div className="relative">
              {isLoading && <LoadingOverlay variant="overlay" message="Cargando..." />}
              <ResponsiveTable dense>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"></TableCell>
                  <TableCell>Nº Cargo</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Dedicación</TableCell>
                  <TableCell>Puntaje</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Asignatura</TableCell>
                  <TableCell>Resolución</TableCell>
                  <TableCell>Ocupante</TableCell>
                  <TableCell>Fecha alta</TableCell>
                  <TableCell>Fecha baja</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cargos.map((c) => {
                  const tieneePuntaje = c.puntaje !== null && c.puntaje !== undefined;
                  const activo = c.estado === "1";
                  const ocup = c.ocupacion_actual;
                  return (
                    <TableRow key={c.id} className="hover:bg-gray-50">
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={seleccionados.has(c.id)}
                          onChange={() => toggleSeleccion(c.id)}
                          disabled={!activo || !tieneePuntaje}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{c.numero_de_cargo}</TableCell>
                      <TableCell>
                        {c.tipo_cargo_detalle
                          ? `${c.tipo_cargo_detalle.sigla || ""} ${c.tipo_cargo_detalle.descripcion}`.trim()
                          : "—"}
                      </TableCell>
                      <TableCell>{c.tipo_cargo_detalle?.dedicacion || "—"}</TableCell>
                      <TableCell>{c.puntaje ?? "—"}</TableCell>
                      <TableCell>
                        {c.departamento_detalle ? (
                          <span className="text-xs text-gray-800">
                            {c.departamento_detalle.nombre}
                          </span>
                        ) : (
                          <span className="text-orange-600 text-xs font-medium">
                            Sin vincular
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.asignatura_detalle ? (
                          <span className="text-xs text-gray-800">
                            {c.asignatura_detalle.codigo} — {c.asignatura_detalle.nombre}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.resolucion_oficializacion_detalle ? (
                          <span className="text-xs text-gray-800">
                            Nº {c.resolucion_oficializacion_detalle.nresolucion}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ocup?.ocupante ? (
                          <div className="flex flex-col leading-tight">
                            <span className="text-xs text-gray-800 font-medium">
                              {ocup.ocupante.apellido}, {ocup.ocupante.nombre}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              DNI {ocup.ocupante.dni}
                              {ocup.ocupante.legajo ? ` · Leg. ${ocup.ocupante.legajo}` : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Vacante</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatFecha(ocup?.fecha_inicio)}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {ocup?.fecha_fin ? formatFecha(ocup.fecha_fin) : ""}
                      </TableCell>
                      <TableCell>{activo ? "Activo" : "Inactivo"}</TableCell>
                      <TableCell>
                        <ActionMenu
                          items={[
                            {
                              items: [
                                {
                                  label: "Editar",
                                  icon: <EditIcon fontSize="small" />,
                                  onClick: () => router.push(`/dashboard/cargos/edit/${c.id}`),
                                },
                                {
                                  label: "Ver historial",
                                  icon: <HistoryIcon fontSize="small" />,
                                  onClick: () => router.push(`/dashboard/cargos/${c.id}/historial`),
                                },
                                {
                                  label: c.departamento ? "Re-vincular" : "Vincular a departamento",
                                  icon: c.departamento ? (
                                    <LinkIcon fontSize="small" />
                                  ) : (
                                    <LinkOffIcon fontSize="small" />
                                  ),
                                  onClick: () => setOpenVincular(c),
                                },
                              ],
                            },
                            {
                              items: [
                                {
                                  label: "Descomponer",
                                  icon: <CallSplitIcon fontSize="small" />,
                                  onClick: () => setOpenDescomponer(c),
                                  disabled: !activo || !tieneePuntaje,
                                  helperText: !activo
                                    ? "Cargo inactivo"
                                    : !tieneePuntaje
                                    ? "Sin puntaje"
                                    : undefined,
                                },
                                {
                                  label: "Renovar",
                                  icon: <AutorenewIcon fontSize="small" />,
                                  onClick: () => renovar(c),
                                  disabled: !activo || !c.tipo_cargo,
                                  helperText: !c.tipo_cargo ? "Sin tipo asignado" : undefined,
                                },
                              ],
                            },
                            {
                              items: [
                                {
                                  label: "Eliminar",
                                  icon: <DeleteIcon fontSize="small" />,
                                  onClick: () => eliminar(c.id),
                                  disabled: !activo,
                                  danger: true,
                                },
                              ],
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {cargos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                      No hay cargos para mostrar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              </ResponsiveTable>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentPage > 1
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}>
                Anterior
              </button>
              <span className="text-gray-600 font-medium">
                Página {currentPage} de {totalPages || 1}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentPage < totalPages
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}>
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {openDescomponer && (
          <DescomponerModal
            cargo={openDescomponer}
            onClose={() => setOpenDescomponer(null)}
            onSuccess={() => {
              setOpenDescomponer(null);
              fetchData(currentUrl);
            }}
          />
        )}

        {openCombinar && (
          <CombinarModal
            cargos={seleccionadosCargos}
            onClose={() => setOpenCombinar(false)}
            onSuccess={() => {
              setOpenCombinar(false);
              setSeleccionados(new Set());
              fetchData(currentUrl);
            }}
          />
        )}

        {openVincular && (
          <VincularModal
            cargo={openVincular}
            onClose={() => setOpenVincular(null)}
            onSuccess={() => {
              setOpenVincular(null);
              fetchData(currentUrl);
            }}
          />
        )}
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaCargos);
