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
} from "@mui/material";
import ResponsiveTable from "@/components/ResponsiveTable";
import { FilterContainer, FilterInput } from "@/components/Filters";
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: "12px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
      }}
    >
      <DialogTitle className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
        {title}
      </DialogTitle>
      <DialogContent className="p-4">
        <div className="mt-4">
          <FilterContainer onApply={applyFilters} onClear={clearFilters}>
            {filterFields.map((field) => (
              <FilterInput
                key={field.key}
                label={field.label}
                value={filters[field.key] || ""}
                onChange={(value) => handleFilterChange(field.key, value)}
                placeholder={field.placeholder}
              />
            ))}
          </FilterContainer>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <ResponsiveTable>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)}>{col.label}</TableCell>
                  ))}
                  <TableCell>Seleccionar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow
                    key={getItemId(item)}
                    className="hover:bg-blue-50 transition-colors duration-200"
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={`${getItemId(item)}-${String(col.key)}`}
                        className="font-medium py-2"
                      >
                        {col.render
                          ? col.render(item)
                          : getNestedValue(item, String(col.key)) ?? "N/A"}
                      </TableCell>
                    ))}
                    <TableCell className="py-2">
                      <button
                        onClick={() => handleSelect(item)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm"
                      >
                        Seleccionar
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ResponsiveTable>

            {data.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron resultados
              </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => prevUrl && fetchData(prevUrl)}
                disabled={!prevUrl}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !prevUrl
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}
              >
                Anterior
              </button>
              <Typography className="font-medium text-gray-700 text-sm">
                Pagina {currentPage} de {totalPages || 1}
              </Typography>
              <button
                onClick={() => nextUrl && fetchData(nextUrl)}
                disabled={!nextUrl}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !nextUrl
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </DialogContent>
      <DialogActions className="p-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all duration-200 font-medium"
        >
          Cerrar
        </button>
      </DialogActions>
    </Dialog>
  );
}

export default SearchModal;
