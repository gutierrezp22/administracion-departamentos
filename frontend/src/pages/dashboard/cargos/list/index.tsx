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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import Swal from "sweetalert2";
import DashboardMenu from "../..";
import withAuth from "@/components/withAut";
import {
  FilterContainer,
  FilterInput,
  EstadoFilter,
} from "@/components/Filters";
import DescomponerModal from "@/components/Cargos/DescomponerModal";
import CombinarModal from "@/components/Cargos/CombinarModal";

const normalizeUrl = (url: string) => {
  return url.replace(window.location.origin, "").replace(/^\/+/, "/");
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
  puntaje: string | null;
  estado: string;
}

const ListaCargos = () => {
  const router = useRouter();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [filtroNumero, setFiltroNumero] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("/facet/cargo/?estado=1");
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [openDescomponer, setOpenDescomponer] = useState<Cargo | null>(null);
  const [openCombinar, setOpenCombinar] = useState(false);

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

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

  const filtrar = () => {
    let url = `/facet/cargo/?`;
    const params = new URLSearchParams();
    if (filtroNumero) params.append("numero_de_cargo__icontains", filtroNumero);
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado) {
      params.append("estado", filtroEstado);
    }
    params.append("page", "1");
    url += params.toString();
    setCurrentPage(1);
    setCurrentUrl(url);
  };

  const limpiarFiltros = () => {
    setFiltroNumero("");
    setFiltroEstado("1");
    setCurrentUrl("/facet/cargo/?estado=1");
  };

  const handlePageChange = (newPage: number) => {
    let url = `/facet/cargo/?`;
    const params = new URLSearchParams();
    if (filtroNumero) params.append("numero_de_cargo__icontains", filtroNumero);
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado) {
      params.append("estado", filtroEstado);
    }
    params.append("page", newPage.toString());
    url += params.toString();
    setCurrentPage(newPage);
    setCurrentUrl(url);
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

  if (isLoading) {
    return (
      <DashboardMenu>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700 text-lg font-medium">Cargando cargos...</p>
          </div>
        </div>
      </DashboardMenu>
    );
  }

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Cargos</h1>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => router.push("/dashboard/cargos/create")}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
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
              <EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
            </FilterContainer>

            <ResponsiveTable>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"></TableCell>
                  <TableCell>Nº Cargo</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Dedicación</TableCell>
                  <TableCell>Puntaje</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cargos.map((c) => {
                  const tieneePuntaje = c.puntaje !== null && c.puntaje !== undefined;
                  const activo = c.estado === "1";
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
                      <TableCell>{activo ? "Activo" : "Inactivo"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/cargos/edit/${c.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                            title="Editar">
                            <EditIcon fontSize="small" />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/cargos/${c.id}/historial`)}
                            className="p-2 text-gray-700 hover:bg-gray-100 rounded-full"
                            title="Historial">
                            <HistoryIcon fontSize="small" />
                          </button>
                          <button
                            onClick={() => setOpenDescomponer(c)}
                            disabled={!activo || !tieneePuntaje}
                            className="p-2 text-orange-600 hover:bg-orange-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Descomponer">
                            <CallSplitIcon fontSize="small" />
                          </button>
                          <button
                            onClick={() => renovar(c)}
                            disabled={!activo || !c.tipo_cargo}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Renovar">
                            <AutorenewIcon fontSize="small" />
                          </button>
                          <button
                            onClick={() => eliminar(c.id)}
                            disabled={!activo}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Eliminar">
                            <DeleteIcon fontSize="small" />
                          </button>
                        </div>
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
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaCargos);
