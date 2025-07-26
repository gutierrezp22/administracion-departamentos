import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import ResponsiveTable from "../../../../components/ResponsiveTable";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ViewComfyIcon from "@mui/icons-material/ViewComfy";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PeopleIcon from "@mui/icons-material/People";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useRouter } from "next/router"; // Importa useRouter de Next.js
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut"; // Importa el HOC

import {
  FilterContainer,
  FilterInput,
  EstadoFilter,
} from "../../../../components/Filters";
import Swal from "sweetalert2";
import DeleteIcon from "@mui/icons-material/Delete";
import API from "@/api/axiosConfig";

interface Departamento {
  id: number;
  nombre: string;
  telefono: string;
  estado: string;
  interno: string;
  mail_departamento: string;
  mail_jefe_departamento: string;
}

const ListaDepartamentos = () => {
  const router = useRouter(); // Usamos useRouter para manejar la navegación
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroTelefono, setFiltroTelefono] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(`/facet/departamento/`);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Función para normalizar URLs y evitar duplicación de /api/api/ en producción
  const normalizeUrl = (url: string) => {
    if (url.startsWith("http")) {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    }
    return url.replace(/^\/+/, "/");
  };

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl, fetchData]);

  const fetchData = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await API.get(url);
      setDepartamentos(response.data.results);

      // Normalizar URLs de paginación para evitar problemas en producción
      const normalizedNext = response.data.next
        ? normalizeUrl(response.data.next)
        : null;
      const normalizedPrev = response.data.previous
        ? normalizeUrl(response.data.previous)
        : null;

      console.log("Original next URL:", response.data.next);
      console.log("Normalized next URL:", normalizedNext);
      console.log("Original prev URL:", response.data.previous);
      console.log("Normalized prev URL:", normalizedPrev);

      setNextUrl(normalizedNext);
      setPrevUrl(normalizedPrev);
      setTotalItems(response.data.count);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al obtener los datos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filtrarDepartamentos = () => {
    let url = `/facet/departamento/?`;
    const params = new URLSearchParams();
    if (filtroNombre !== "") {
      params.append("nombre__icontains", filtroNombre);
    }
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado !== "" && filtroEstado !== "todos") {
      params.append("estado", filtroEstado.toString());
    }
    if (filtroTelefono !== "") {
      params.append("telefono__icontains", filtroTelefono);
    }
    params.append("page", "1");
    url += params.toString();
    setCurrentPage(1);
    setCurrentUrl(url);
  };

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroTelefono("");
    setFiltroEstado("1");
  };

  const handlePageChange = (newPage: number) => {
    let url = `/facet/departamento/?`;
    const params = new URLSearchParams();

    if (filtroNombre !== "") {
      params.append("nombre__icontains", filtroNombre);
    }
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado !== "" && filtroEstado !== "todos") {
      params.append("estado", filtroEstado.toString());
    }
    if (filtroTelefono !== "") {
      params.append("telefono__icontains", filtroTelefono);
    }

    params.append("page", newPage.toString());
    url += params.toString();

    setCurrentPage(newPage);
    setCurrentUrl(url);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const descargarExcel = async () => {
    try {
      let allDepartamentos: Departamento[] = [];

      let url = `/facet/departamento/?`;
      const params = new URLSearchParams();
      if (filtroNombre !== "") {
        params.append("nombre__icontains", filtroNombre);
      }
      if (filtroEstado !== "") {
        params.append("estado", filtroEstado.toString());
      }
      if (filtroTelefono !== "") {
        params.append("telefono__icontains", filtroTelefono);
      }
      url += params.toString();

      while (url) {
        const response = await API.get(url);
        const { results, next } = response.data;

        allDepartamentos = [
          ...allDepartamentos,
          ...results.map((departamento: any) => ({
            nombre: departamento.nombre,
            telefono: departamento.telefono,
            estado: departamento.estado,
            interno: departamento.interno,
            mail_departamento: departamento.mail_departamento || '',
            mail_jefe_departamento: departamento.mail_jefe_departamento || '',
          })),
        ];

        // Normalizar la URL de paginación para la siguiente iteración
        url = next ? normalizeUrl(next) : '';
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(allDepartamentos);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Departamentos");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(excelBlob, "departamentos.xlsx");
    } catch (error) {
      console.error("Error downloading Excel:", error);
    }
  };

  const eliminarDepartamento = async (id: number) => {
    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        await API.delete(`/facet/departamento/${id}/`);
        Swal.fire(
          "Eliminado!",
          "El departamento ha sido eliminado.",
          "success"
        );
        fetchData(currentUrl);
      }
    } catch (error) {
      Swal.fire("Error!", "No se pudo eliminar el departamento.", "error");
    }
  };

  // Modal de loading
  if (isLoading) {
    return (
      <DashboardMenu>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700 text-lg font-medium">
              Cargando departamentos...
            </p>
          </div>
        </div>
      </DashboardMenu>
    );
  }

  return (
    <DashboardMenu>
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Departamentos</h1>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => router.push("/dashboard/departments/create")}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <AddIcon /> Agregar Departamento
            </button>
            <button
              onClick={() =>
                router.push("/dashboard/departments/departamentoJefe")
              }
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <PeopleIcon /> Jefes
            </button>
            <button
              onClick={descargarExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <FileDownloadIcon /> Descargar Excel
            </button>
          </div>

          <FilterContainer
            onApply={filtrarDepartamentos}
            onClear={limpiarFiltros}>
            <FilterInput
              label="Nombre"
              value={filtroNombre}
              onChange={setFiltroNombre}
              placeholder="Buscar por nombre"
            />
            <FilterInput
              label="Teléfono"
              value={filtroTelefono}
              onChange={setFiltroTelefono}
              placeholder="Buscar por teléfono"
            />
            <EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
          </FilterContainer>

          <ResponsiveTable>
            <TableHead>
              <TableRow>
                <TableCell>
                  Nombre
                </TableCell>
                <TableCell>
                  Teléfono
                </TableCell>
                <TableCell>
                  Interno
                </TableCell>
                <TableCell>
                  Mail Departamento
                </TableCell>
                <TableCell>
                  Mail Jefe
                </TableCell>
                <TableCell>
                  Estado
                </TableCell>
                <TableCell>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
              <TableBody>
                {departamentos.map((departamento) => (
                  <TableRow key={departamento.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-800">
                      {departamento.nombre}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {departamento.telefono}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {departamento.interno}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {departamento.mail_departamento || '-'}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {departamento.mail_jefe_departamento || '-'}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {departamento.estado === "1" ? "Activo" : "Inactivo"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/departments/edit/${departamento.id}`
                            )
                          }
                          className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => eliminarDepartamento(departamento.id)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-100 transition-colors duration-200">
                          <DeleteIcon />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
              } transition-colors duration-200`}>
              Anterior
            </button>
            <span className="text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentPage < totalPages
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200`}>
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaDepartamentos);
