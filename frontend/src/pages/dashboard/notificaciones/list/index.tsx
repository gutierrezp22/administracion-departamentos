import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import API from "@/api/axiosConfig";
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import { API_BASE_URL } from "../../../../utils/config";
import { FilterContainer, FilterInput } from "../../../../components/Filters";

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
    `${API_BASE_URL}/facet/notificacion/`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      const response = await API.get(url);
      setNotificaciones(response.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
      setCurrentPage(
        url.includes("page=")
          ? parseInt(new URL(url).searchParams.get("page") || "1")
          : 1
      );
    } catch (error) {
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

    const newUrl = `${API_BASE_URL}/facet/notificacion/?${params.toString()}`;
    setCurrentUrl(newUrl);
  };

  const clearFilters = () => {
    setFilters({
      persona_apellido: "",
      persona_nombre: "",
      fecha_creacion: "",
      mensaje: "",
    });
    setCurrentUrl(`${API_BASE_URL}/facet/notificacion/`);
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
              <FilterInput
                label="Fecha"
                type="date"
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

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHead>
                  <TableRow className="bg-blue-500">
                    <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Apellido</TableCell>
                    <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Nombre</TableCell>
                    <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Fecha</TableCell>
                    <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Mensaje</TableCell>
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
                        <button
                          onClick={() => mostrarMensaje(noti.mensaje)}
                          className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-colors duration-200">
                          <VisibilityIcon />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => prevUrl && setCurrentUrl(prevUrl)}
                disabled={!prevUrl}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  prevUrl
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}>
                Anterior
              </button>
              <span className="text-gray-600 font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => nextUrl && setCurrentUrl(nextUrl)}
                disabled={!nextUrl}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  nextUrl
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}>
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaNotificaciones);
