import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ResponsiveTable from "@/components/ResponsiveTable";
import LoadingOverlay from "@/components/LoadingOverlay";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import ActionMenu from "@/components/ActionMenu";
import Swal from "sweetalert2";
import DashboardMenu from "../..";
import withAuth from "@/components/withAut";
import {
  FilterContainer,
  FilterInput,
  FilterSelect,
  EstadoFilter,
} from "@/components/Filters";
import VincularModal from "@/components/Cargos/VincularModal";

const normalizeUrl = (url: string) =>
  url.replace(window.location.origin, "").replace(/^\/+/, "/");

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
  cargo_departamento: number | null;
  cargo_departamento_detalle: {
    id: number;
    descripcion: string;
    departamento: { id: number; nombre: string } | null;
    asignatura: { id: number; nombre: string; codigo: string } | null;
  } | null;
  resolucion_oficializacion: number | null;
  resolucion_oficializacion_detalle: {
    id: number;
    nresolucion: string;
    nexpediente: string;
  } | null;
  puntaje: string | null;
  estado: string;
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
  const [filtroVinculacion, setFiltroVinculacion] = useState<string>("");
  const [totalPendientes, setTotalPendientes] = useState<number>(0);
  const [descripcionOptions, setDescripcionOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    "/facet/cargo/?estado=1"
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [openVincular, setOpenVincular] = useState<Cargo | null>(null);

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
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
    fetchTipos();

    const fetchPendientes = async () => {
      try {
        const r = await API.get(
          "/facet/cargo/?cargo_departamento__isnull=True&estado=1&page_size=1"
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
    if (filtroVinculacion === "sin_vincular") params.append("cargo_departamento__isnull", "True");
    if (filtroVinculacion === "vinculados") params.append("cargo_departamento__isnull", "False");
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
    setFiltroVinculacion("");
    setCurrentUrl("/facet/cargo/?estado=1");
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setCurrentUrl(`/facet/cargo/?${buildParams(newPage).toString()}`);
  };

  const eliminar = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Eliminar cargo (plata)?",
      text: "Se marcará como inactivo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/facet/cargo/${id}/`);
      Swal.fire("Eliminado", "El cargo fue desactivado.", "success");
      fetchData(currentUrl);
    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar.", "error");
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Cargos (payroll)</h1>
            <p className="text-sm text-gray-600 mt-1">
              Cargos de plata importados desde el Excel del decanato. Cada uno
              se vincula a un Cargo de Departamento (operaciones de
              descomposición / combinación / renovación / historial viven en
              esa sección).
            </p>
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
                      Cargos del Excel todavía sin Cargo de Departamento asignado.
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
            </FilterContainer>

            <div className="relative">
              {isLoading && <LoadingOverlay variant="overlay" message="Cargando..." />}
              <ResponsiveTable dense>
                <TableHead>
                  <TableRow>
                    <TableCell>Nº Cargo</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Dedicación</TableCell>
                    <TableCell>Puntaje</TableCell>
                    <TableCell>Cargo de Departamento</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cargos.map((c) => {
                    const activo = c.estado === "1";
                    return (
                      <TableRow key={c.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{c.numero_de_cargo}</TableCell>
                        <TableCell>
                          {c.tipo_cargo_detalle
                            ? `${c.tipo_cargo_detalle.sigla || ""} ${c.tipo_cargo_detalle.descripcion}`.trim()
                            : "—"}
                        </TableCell>
                        <TableCell>{c.tipo_cargo_detalle?.dedicacion || "—"}</TableCell>
                        <TableCell>{c.puntaje ?? "—"}</TableCell>
                        <TableCell>
                          {c.cargo_departamento_detalle ? (
                            <div className="flex flex-col leading-tight">
                              <span className="text-xs text-gray-800 font-medium">
                                {c.cargo_departamento_detalle.descripcion || `#${c.cargo_departamento_detalle.id}`}
                              </span>
                              {c.cargo_departamento_detalle.departamento && (
                                <span className="text-[11px] text-gray-500">
                                  {c.cargo_departamento_detalle.departamento.nombre}
                                  {c.cargo_departamento_detalle.asignatura && (
                                    <> · {c.cargo_departamento_detalle.asignatura.codigo}</>
                                  )}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-orange-600 text-xs font-medium">Sin vincular</span>
                          )}
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
                                    label: c.cargo_departamento ? "Re-vincular" : "Vincular a Cargo de Departamento",
                                    icon: c.cargo_departamento ? (
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
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
