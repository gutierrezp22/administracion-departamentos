import { useEffect, useState } from "react";
import "./styles.css";
import API from "@/api/axiosConfig";
import { TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import ResponsiveTable from "../../../../components/ResponsiveTable";
import ActionMenu from "../../../../components/ActionMenu";
import Pagination from "../../../../components/Pagination";
import LoadingOverlay from "../../../../components/LoadingOverlay";
import { normalizeUrl } from "@/utils/urlHelpers";
import {
  FilterContainer,
  FilterInput,
  FilterDatePicker,
} from "../../../../components/Filters";

interface Notificacion {
  id: number;
  fecha_creacion: string;
  leido: boolean;
  mensaje: string;
  persona: number;
  persona_apellido: string;
  persona_nombre: string;
}

const ListaNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [filters, setFilters] = useState({
    persona_apellido: "",
    persona_nombre: "",
    fecha_creacion: "",
    mensaje: "",
  });
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `/facet/notificacion/`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      setIsLoading(true);
      // Si la URL es absoluta (comienza con http), extraer solo la parte de la ruta
      let apiUrl = url;
      if (url.startsWith("http")) {
        const urlObj = new URL(url);
        apiUrl = urlObj.pathname + urlObj.search;
      }

      const response = await API.get(apiUrl);
      setNotificaciones(response.data.results);
      setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrl(
        response.data.previous ? normalizeUrl(response.data.previous) : null
      );
      setTotalItems(response.data.count);

      // Calcular la página actual basándose en el parámetro "page" de la URL
      // (el backend usa PageNumberPagination)
      const urlParams = new URLSearchParams(apiUrl.split("?")[1] || "");
      const page = parseInt(urlParams.get("page") || "1");
      setCurrentPage(page);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al obtener las notificaciones.",
      });
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (filters.persona_apellido.trim()) {
      params.append("persona_apellido", filters.persona_apellido.trim());
    }
    if (filters.persona_nombre.trim()) {
      params.append("persona_nombre", filters.persona_nombre.trim());
    }
    if (filters.fecha_creacion.trim()) {
      params.append("fecha_creacion_after", filters.fecha_creacion);
      params.append("fecha_creacion_before", filters.fecha_creacion);
    }
    if (filters.mensaje.trim()) {
      params.append("mensaje__icontains", filters.mensaje.trim());
    }

    params.append("page_size", pageSize.toString());

    const newUrl = `/facet/notificacion/?${params.toString()}`;
    setCurrentUrl(newUrl);
  };

  const clearFilters = () => {
    setFilters({
      persona_apellido: "",
      persona_nombre: "",
      fecha_creacion: "",
      mensaje: "",
    });
    setCurrentUrl(`/facet/notificacion/`);
  };

  const mostrarMensaje = (mensaje: string) => {
    Swal.fire({
      title: "Mensaje enviado",
      text: mensaje,
      icon: "info",
    });
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Notificaciones</h1>
          </div>

          <div className="p-6">
            <FilterContainer onApply={applyFilters} onClear={clearFilters}>
              <FilterInput
                label="Apellido"
                value={filters.persona_apellido}
                onChange={(value) =>
                  handleFilterChange("persona_apellido", value)
                }
                placeholder="Buscar por apellido..."
              />
              <FilterInput
                label="Nombre"
                value={filters.persona_nombre}
                onChange={(value) =>
                  handleFilterChange("persona_nombre", value)
                }
                placeholder="Buscar por nombre..."
              />
              <FilterDatePicker
                label="Fecha"
                value={filters.fecha_creacion}
                onChange={(value) =>
                  handleFilterChange("fecha_creacion", value)
                }
              />
              <FilterInput
                label="Mensaje"
                value={filters.mensaje}
                onChange={(value) => handleFilterChange("mensaje", value)}
                placeholder="Buscar en mensaje..."
              />
            </FilterContainer>

            <div className="relative">
              {isLoading && (
                <LoadingOverlay variant="overlay" message="Cargando..." />
              )}
              <ResponsiveTable dense>
                <TableHead>
                  <TableRow>
                    <TableCell>Apellido</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notificaciones.map((noti) => (
                    <TableRow
                      key={noti.id}
                      className="hover:bg-gray-50 transition-colors duration-150">
                      <TableCell className="text-gray-800">
                        {noti.persona_apellido}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {noti.persona_nombre}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {noti.fecha_creacion
                          ? (() => {
                              const [day, month, year] = noti.fecha_creacion
                                .split(" ")[0]
                                .split("/");
                              const fixedDate = new Date(
                                `${year}-${month}-${day}T00:00:00`
                              );
                              return fixedDate.toLocaleDateString();
                            })()
                          : "Fecha inválida"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            noti.leido
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-700"
                          }`}>
                          {noti.leido ? "Leída" : "No leída"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ActionMenu
                          items={[
                            {
                              items: [
                                {
                                  label: "Ver mensaje",
                                  icon: <VisibilityIcon fontSize="small" />,
                                  onClick: () => mostrarMensaje(noti.mensaje),
                                },
                              ],
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ResponsiveTable>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrevious={() => prevUrl && setCurrentUrl(prevUrl)}
              onNext={() => nextUrl && setCurrentUrl(nextUrl)}
              hasPrevious={!!prevUrl}
              hasNext={!!nextUrl}
            />
          </div>
        </div>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaNotificaciones);
