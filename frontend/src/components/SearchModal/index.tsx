import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  TableContainer,
  Paper,
  Table,
} from "@mui/material";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentMagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import API from "@/api/axiosConfig";
import { normalizeUrl } from "@/hooks/useSearch";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface SearchModalProps<T> {
  open: boolean;
  onClose: () => void;
  onSelect: (item: T) => void;
  title: string;
  apiEndpoint: string;
  columns: Column<T>[];
  filterFields: {
    key: string;
    label: string;
    placeholder: string;
    filterParam: string;
  }[];
  getItemId: (item: T) => number | string;
  pageSize?: number;
}

/**
 * Componente modal unificado para busqueda y seleccion de items.
 * Usado en formularios de creacion/edicion para seleccionar entidades relacionadas.
 */
function SearchModal<T>({
  open,
  onClose,
  onSelect,
  title,
  apiEndpoint,
  columns,
  filterFields,
  getItemId,
  pageSize = 10,
}: SearchModalProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.ceil(totalItems / pageSize);

  const fetchData = useCallback(async (url: string) => {
    try {
      setIsLoading(true);
      const normalizedUrl = normalizeUrl(url);
      const response = await API.get(normalizedUrl);

      setData(response.data.results);
      setTotalItems(response.data.count);
      setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrl(response.data.previous ? normalizeUrl(response.data.previous) : null);

      // Calcular pagina actual
      const urlParams = new URLSearchParams(normalizedUrl.split("?")[1] || "");
      const offset = parseInt(urlParams.get("offset") || "0");
      const limit = parseInt(urlParams.get("limit") || String(pageSize));
      setCurrentPage(Math.floor(offset / limit) + 1);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    if (open) {
      fetchData(apiEndpoint);
      setFilters({});
    }
  }, [open, apiEndpoint, fetchData]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();

    filterFields.forEach((field) => {
      const value = filters[field.key];
      if (value && value.trim()) {
        params.append(field.filterParam, value.trim());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `${apiEndpoint}?${queryString}` : apiEndpoint;
    fetchData(url);
  };

  const clearFilters = () => {
    setFilters({});
    fetchData(apiEndpoint);
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    onClose();
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, key: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold px-6 py-4 flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <DocumentMagnifyingGlassIcon className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg">{title}</span>
      </DialogTitle>
      
      <DialogContent className="p-6 bg-gray-50/30">
        {/* Filtros Compactos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <FunnelIcon className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-gray-800">Filtros de Búsqueda</span>
            </div>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-red-50"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
              <span>Limpiar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
            {filterFields.map((field) => (
              <div key={field.key} className="relative">
                <input
                  type="text"
                  value={filters[field.key] || ""}
                  onChange={(e) => handleFilterChange(field.key, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, field.key)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
                    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                    hover:border-blue-400 hover:bg-white
                    transition-all duration-200
                    text-sm text-gray-700 placeholder-gray-400
                    shadow-sm pr-9"
                />
                <MagnifyingGlassIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              onClick={applyFilters}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 
                hover:from-blue-600 hover:to-blue-700 
                text-white px-4 py-2 rounded-lg shadow-md shadow-blue-500/20
                transition-all duration-200 text-sm font-semibold
                hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span>Buscar</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-12 bg-white rounded-xl shadow-sm border border-gray-200/60">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <Typography className="mt-4 text-gray-600 font-medium">
              Cargando...
            </Typography>
          </div>
        ) : (
          <>
            {/* Tabla de Resultados */}
            <TableContainer
              component={Paper}
              className="shadow-sm rounded-xl overflow-hidden border border-gray-200/60"
              style={{ maxHeight: "400px", overflow: "auto" }}
            >
              <Table size="small">
                <TableHead className="bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10">
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell 
                        key={String(col.key)}
                        className="text-white font-bold py-3 text-sm"
                      >
                        {col.label}
                      </TableCell>
                    ))}
                    <TableCell className="text-white font-bold py-3 text-sm text-center" style={{ width: "120px" }}>
                      Acción
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((item) => (
                      <TableRow
                        key={getItemId(item)}
                        className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                      >
                        {columns.map((col) => (
                          <TableCell
                            key={`${getItemId(item)}-${String(col.key)}`}
                            className="py-3 text-sm text-gray-700"
                          >
                            {col.render
                              ? col.render(item)
                              : getNestedValue(item, String(col.key)) ?? "N/A"}
                          </TableCell>
                        ))}
                        <TableCell className="py-3 text-center">
                          <button
                            onClick={() => handleSelect(item)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                              text-white px-4 py-1.5 rounded-lg shadow-md 
                              transition-all duration-200 font-medium text-sm
                              hover:shadow-lg hover:-translate-y-0.5"
                          >
                            Seleccionar
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center">
                          <div className="bg-gray-100 rounded-full p-4 mb-3">
                            <DocumentMagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">
                            No se encontraron resultados
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            Intenta con otros filtros
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación Mejorada */}
            {data.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-5 gap-4 bg-white rounded-xl shadow-sm border border-gray-200/60 p-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => prevUrl && fetchData(prevUrl)}
                    disabled={!prevUrl || isLoading}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      !prevUrl
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm"
                    }`}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Anterior
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <Typography className="font-medium text-gray-600 text-sm">
                    Página
                  </Typography>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          const offset = (page - 1) * pageSize;
                          const baseUrl = apiEndpoint.split("?")[0];
                          const params = new URLSearchParams();
                          params.set("offset", offset.toString());
                          params.set("limit", pageSize.toString());
                          fetchData(`${baseUrl}?${params.toString()}`);
                        }
                      }}
                      className="w-14 px-2 py-1.5 text-center border border-gray-200 rounded-lg text-sm font-semibold 
                        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                        hover:border-gray-300 transition-colors"
                      disabled={isLoading}
                    />
                    <Typography className="font-medium text-gray-500 text-sm">
                      de {totalPages || 1}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => nextUrl && fetchData(nextUrl)}
                    disabled={!nextUrl || isLoading}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      !nextUrl
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm"
                    }`}
                  >
                    Siguiente
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Contador de Resultados */}
            {data.length > 0 && (
              <div className="flex justify-center mt-2">
                <Typography className="text-gray-500 text-xs bg-white px-3 py-1 rounded-full border border-gray-200/60">
                  Mostrando <span className="font-semibold text-gray-700">{data.length}</span> de{" "}
                  <span className="font-semibold text-gray-700">{totalItems}</span> resultados
                </Typography>
              </div>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions className="p-4 bg-gray-50 border-t border-gray-200/60">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-white hover:border-gray-400 
            transition-all duration-200 font-medium text-gray-700 text-sm
            hover:shadow-sm bg-white"
        >
          Cerrar
        </button>
      </DialogActions>
    </Dialog>
  );
}

export default SearchModal;
