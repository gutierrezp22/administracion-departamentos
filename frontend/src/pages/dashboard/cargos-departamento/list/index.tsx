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
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import HistoryIcon from "@mui/icons-material/History";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import AutorenewIcon from "@mui/icons-material/Autorenew";
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
import VincularCargoModal from "@/components/CargosDepartamento/VincularCargoModal";
import DescomponerModal from "@/components/CargosDepartamento/DescomponerModal";
import CombinarModal from "@/components/CargosDepartamento/CombinarModal";

const normalizeUrl = (url: string) =>
  url.replace(window.location.origin, "").replace(/^\/+/, "/");

interface CargoDepartamento {
  id: number;
  descripcion: string;
  departamento: number | null;
  departamento_detalle: { id: number; nombre: string } | null;
  asignatura: number | null;
  asignatura_detalle: { id: number; codigo: string; nombre: string } | null;
  tipo_cargo: number | null;
  tipo_cargo_detalle: {
    sigla: string;
    descripcion: string;
    dedicacion: string;
    puntaje: string | null;
  } | null;
  puntaje: string | null;
  cargo_vinculado: { id: number; numero_de_cargo: number } | null;
  estado: string;
}

const ListaCargosDepartamento = () => {
  const router = useRouter();
  const [items, setItems] = useState<CargoDepartamento[]>([]);
  const [departamentoOptions, setDepartamentoOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [tipoCargoOptions, setTipoCargoOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [filtroDescripcion, setFiltroDescripcion] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroTipoCargo, setFiltroTipoCargo] = useState("");
  const [filtroDedicacion, setFiltroDedicacion] = useState("");
  const [filtroVinculacion, setFiltroVinculacion] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");

  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    "/facet/cargo-departamento/?estado=1"
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [openVincular, setOpenVincular] = useState<CargoDepartamento | null>(null);
  const [openDescomponer, setOpenDescomponer] = useState<CargoDepartamento | null>(null);
  const [openCombinar, setOpenCombinar] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
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
    const fetchTipos = async () => {
      try {
        const r = await API.get(`/facet/tipo-cargo/?page_size=100`);
        const tipos: { id: number; descripcion: string; dedicacion: string }[] =
          r.data.results || [];
        const set = new Set<string>();
        tipos.forEach((t) => set.add(t.descripcion));
        setTipoCargoOptions(
          Array.from(set).sort().map((d) => ({ value: d, label: d }))
        );
      } catch (e) {
        console.error("Error cargando tipos de cargo:", e);
      }
    };
    fetchDeptos();
    fetchTipos();
  }, []);

  const fetchData = async (url: string) => {
    try {
      setIsLoading(true);
      const r = await API.get(url);
      setItems(r.data.results || []);
      setNextUrl(r.data.next ? normalizeUrl(r.data.next) : null);
      setPrevUrl(r.data.previous ? normalizeUrl(r.data.previous) : null);
      setTotalItems(r.data.count || 0);
    } catch (e) {
      Swal.fire("Error", "No se pudo obtener la lista.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const buildParams = (page = 1): URLSearchParams => {
    const params = new URLSearchParams();
    if (filtroDescripcion) params.append("search", filtroDescripcion);
    if (filtroDepartamento) params.append("departamento", filtroDepartamento);
    if (filtroTipoCargo) params.append("tipo_cargo__descripcion", filtroTipoCargo);
    if (filtroDedicacion) params.append("tipo_cargo__dedicacion", filtroDedicacion);
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado) {
      params.append("estado", filtroEstado);
    }
    if (filtroVinculacion === "vacantes") params.append("cargo__isnull", "True");
    if (filtroVinculacion === "ocupados") params.append("cargo__isnull", "False");
    params.append("page", page.toString());
    return params;
  };

  const filtrar = () => {
    setCurrentPage(1);
    setCurrentUrl(`/facet/cargo-departamento/?${buildParams(1).toString()}`);
  };

  const limpiarFiltros = () => {
    setFiltroDescripcion("");
    setFiltroDepartamento("");
    setFiltroTipoCargo("");
    setFiltroDedicacion("");
    setFiltroEstado("1");
    setFiltroVinculacion("");
    setCurrentUrl("/facet/cargo-departamento/?estado=1");
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setCurrentUrl(`/facet/cargo-departamento/?${buildParams(newPage).toString()}`);
  };

  const eliminar = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Eliminar Cargo de Departamento?",
      text: "Se marcará como inactivo (soft delete).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/facet/cargo-departamento/${id}/`);
      Swal.fire("Eliminado", "El Cargo de Departamento fue desactivado.", "success");
      fetchData(currentUrl);
    } catch {
      Swal.fire("Error", "No se pudo eliminar.", "error");
    }
  };

  const renovar = async (cargoDep: CargoDepartamento) => {
    const { value: confirmed } = await Swal.fire({
      title: "Renovar Cargo de Departamento",
      text: "Se crea uno nuevo igual y el actual queda inactivo. Si tenía un Cargo (plata) vinculado, queda disponible.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Renovar",
      cancelButtonText: "Cancelar",
    });
    if (!confirmed) return;
    try {
      await API.post(`/facet/cargo-departamento/${cargoDep.id}/renovar/`, {});
      Swal.fire("Renovado", "Cargo de Departamento renovado.", "success");
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

  const desvincularCargo = async (cargoDep: CargoDepartamento) => {
    if (!cargoDep.cargo_vinculado) return;
    const r = await Swal.fire({
      title: "Desvincular cargo",
      text: `El cargo #${cargoDep.cargo_vinculado.numero_de_cargo} vuelve a estar disponible.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Desvincular",
      cancelButtonText: "Cancelar",
    });
    if (!r.isConfirmed) return;
    try {
      await API.post(`/facet/cargo-departamento/${cargoDep.id}/desvincular-cargo/`, {});
      Swal.fire("Listo", "Cargo desvinculado.", "success");
      fetchData(currentUrl);
    } catch (e: any) {
      Swal.fire("Error", e.response?.data?.detail || "No se pudo desvincular.", "error");
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const seleccionadosCargosDep = items.filter((c) => seleccionados.has(c.id));
  const sumaPuntajesSeleccionados = seleccionadosCargosDep.reduce(
    (acc, c) => acc + Number(c.puntaje || 0),
    0
  );

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">
              Cargos de Departamento
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Cargos que define cada departamento. A cada uno se le puede
              asociar opcionalmente una asignatura del depto y vincularle un
              Cargo (plata) disponible.
            </p>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => router.push("/dashboard/cargos-departamento/create")}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all duration-200 font-semibold text-sm">
                <AddIcon /> Crear Cargo de Departamento
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
                  Suma de puntajes: <strong className="ml-1">{sumaPuntajesSeleccionados.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <FilterContainer onApply={filtrar} onClear={limpiarFiltros}>
              <FilterInput
                label="Descripción"
                value={filtroDescripcion}
                onChange={setFiltroDescripcion}
                placeholder="Buscar por descripción"
              />
              <FilterSelect
                label="Departamento"
                value={filtroDepartamento}
                onChange={setFiltroDepartamento}
                options={departamentoOptions}
                placeholder="Todos los departamentos"
              />
              <FilterSelect
                label="Tipo de cargo"
                value={filtroTipoCargo}
                onChange={setFiltroTipoCargo}
                options={tipoCargoOptions}
                placeholder="Todos los tipos"
              />
              <FilterSelect
                label="Dedicación"
                value={filtroDedicacion}
                onChange={setFiltroDedicacion}
                options={[
                  { value: "SIMP", label: "Simple" },
                  { value: "SEMI", label: "Semi (Part-Time)" },
                  { value: "EXCL", label: "Exclusiva (Full-Time)" },
                  { value: "35HS", label: "35 Horas" },
                ]}
                placeholder="Todas las dedicaciones"
              />
              <FilterSelect
                label="Vinculación"
                value={filtroVinculacion}
                onChange={setFiltroVinculacion}
                options={[
                  { value: "vacantes", label: "Vacantes (sin cargo de plata)" },
                  { value: "ocupados", label: "Ocupados" },
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
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Departamento</TableCell>
                    <TableCell>Asignatura</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Dedicación</TableCell>
                    <TableCell>Puntaje</TableCell>
                    <TableCell>Cargo (plata)</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((s) => {
                    const activo = s.estado === "1";
                    const tienePuntaje = s.puntaje !== null && s.puntaje !== undefined;
                    return (
                      <TableRow key={s.id} className="hover:bg-gray-50">
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={seleccionados.has(s.id)}
                            onChange={() => toggleSeleccion(s.id)}
                            disabled={!activo || !tienePuntaje}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {s.descripcion || <span className="text-gray-400 italic">#{s.id}</span>}
                        </TableCell>
                        <TableCell>
                          {s.departamento_detalle?.nombre || "—"}
                        </TableCell>
                        <TableCell>
                          {s.asignatura_detalle ? (
                            <span className="text-xs text-gray-800">
                              {s.asignatura_detalle.codigo} — {s.asignatura_detalle.nombre}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {s.tipo_cargo_detalle ? (
                            <span className="text-xs">
                              {s.tipo_cargo_detalle.sigla ? `${s.tipo_cargo_detalle.sigla} ` : ""}
                              {s.tipo_cargo_detalle.descripcion}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>{s.tipo_cargo_detalle?.dedicacion || "—"}</TableCell>
                        <TableCell>{s.tipo_cargo_detalle?.puntaje ?? "—"}</TableCell>
                        <TableCell>
                          {s.cargo_vinculado ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 border border-green-200 text-green-800 px-2 py-0.5 rounded-full">
                              <LinkIcon sx={{ fontSize: 12 }} />#{s.cargo_vinculado.numero_de_cargo}
                            </span>
                          ) : (
                            <button
                              onClick={() => setOpenVincular(s)}
                              disabled={!activo}
                              className="inline-flex items-center gap-1 text-xs bg-orange-50 border border-orange-200 hover:bg-orange-100 hover:border-orange-300 text-orange-700 px-2 py-0.5 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Vincular un Cargo de plata a este Cargo de Departamento"
                            >
                              <LinkIcon sx={{ fontSize: 12 }} /> Vincular cargo
                            </button>
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
                                    onClick: () =>
                                      router.push(`/dashboard/cargos-departamento/edit/${s.id}`),
                                  },
                                  {
                                    label: "Ver historial",
                                    icon: <HistoryIcon fontSize="small" />,
                                    onClick: () =>
                                      router.push(`/dashboard/cargos-departamento/${s.id}/historial`),
                                  },
                                  {
                                    label: s.cargo_vinculado ? "Desvincular cargo" : "Vincular cargo de plata",
                                    icon: s.cargo_vinculado ? (
                                      <LinkOffIcon fontSize="small" />
                                    ) : (
                                      <LinkIcon fontSize="small" />
                                    ),
                                    onClick: () =>
                                      s.cargo_vinculado ? desvincularCargo(s) : setOpenVincular(s),
                                    disabled: !activo,
                                  },
                                ],
                              },
                              {
                                items: [
                                  {
                                    label: "Descomponer",
                                    icon: <CallSplitIcon fontSize="small" />,
                                    onClick: () => setOpenDescomponer(s),
                                    disabled: !activo || !tienePuntaje,
                                    helperText: !activo
                                      ? "Inactivo"
                                      : !tienePuntaje
                                      ? "Sin puntaje"
                                      : undefined,
                                  },
                                  {
                                    label: "Renovar",
                                    icon: <AutorenewIcon fontSize="small" />,
                                    onClick: () => renovar(s),
                                    disabled: !activo,
                                  },
                                ],
                              },
                              {
                                items: [
                                  {
                                    label: "Eliminar",
                                    icon: <DeleteIcon fontSize="small" />,
                                    onClick: () => eliminar(s.id),
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
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        No hay Cargos de Departamento para mostrar.
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
          <VincularCargoModal
            cargoDep={openVincular}
            onClose={() => setOpenVincular(null)}
            onSuccess={() => {
              setOpenVincular(null);
              fetchData(currentUrl);
            }}
          />
        )}

        {openDescomponer && (
          <DescomponerModal
            cargoDep={openDescomponer}
            onClose={() => setOpenDescomponer(null)}
            onSuccess={() => {
              setOpenDescomponer(null);
              fetchData(currentUrl);
            }}
          />
        )}

        {openCombinar && (
          <CombinarModal
            cargosDep={seleccionadosCargosDep}
            onClose={() => setOpenCombinar(false)}
            onSuccess={() => {
              setOpenCombinar(false);
              setSeleccionados(new Set());
              fetchData(currentUrl);
            }}
          />
        )}
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaCargosDepartamento);
