import { useState, useCallback } from "react";
import API from "@/api/axiosConfig";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface UseSearchOptions {
  baseUrl: string;
  pageSize?: number;
  defaultFilters?: Record<string, string>;
}

interface UseSearchReturn<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  nextUrl: string | null;
  prevUrl: string | null;
  fetchData: (url?: string) => Promise<void>;
  applyFilters: (filters: Record<string, string>) => void;
  clearFilters: () => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  goToPage: (page: number) => void;
  setCurrentUrl: (url: string) => void;
}

/**
 * Normaliza URLs de paginación para evitar problemas con URLs absolutas
 * del backend en producción
 */
export const normalizeUrl = (url: string): string => {
  if (url.startsWith("http")) {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  }
  return url.replace(/^\/+/, "/");
};

/**
 * Hook personalizado para manejar búsqueda y paginación de forma uniforme
 * en todas las páginas de lista del sistema
 */
export function useSearch<T>({
  baseUrl,
  pageSize = 10,
  defaultFilters = {},
}: UseSearchOptions): UseSearchReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(baseUrl);
  const [currentFilters, setCurrentFilters] =
    useState<Record<string, string>>(defaultFilters);

  const totalPages = Math.ceil(totalItems / pageSize);

  const fetchData = useCallback(async (url?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchUrl = url || currentUrl;
      const normalizedUrl = normalizeUrl(fetchUrl);

      const response = await API.get<PaginatedResponse<T>>(normalizedUrl);

      setData(response.data.results);
      setTotalItems(response.data.count);

      // Normalizar URLs de paginación
      setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrl(
        response.data.previous ? normalizeUrl(response.data.previous) : null
      );

      // Calcular página actual desde URL
      const urlParams = new URLSearchParams(normalizedUrl.split("?")[1] || "");
      const offset = parseInt(urlParams.get("offset") || "0");
      const limit = parseInt(urlParams.get("limit") || String(pageSize));
      const page = urlParams.get("page");

      if (page) {
        setCurrentPage(parseInt(page));
      } else {
        setCurrentPage(Math.floor(offset / limit) + 1);
      }
    } catch (err) {
      setError("Error al obtener los datos");
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUrl, pageSize]);

  const buildUrlWithFilters = useCallback(
    (filters: Record<string, string>, page?: number): string => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== undefined) {
          // Manejar filtro de estado especial
          if (key === "estado" && value === "todos") {
            params.append("show_all", "true");
          } else {
            params.append(key, value);
          }
        }
      });

      if (page) {
        params.append("page", String(page));
      }

      const queryString = params.toString();
      return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    },
    [baseUrl]
  );

  const applyFilters = useCallback(
    (filters: Record<string, string>) => {
      setCurrentFilters(filters);
      const url = buildUrlWithFilters(filters, 1);
      setCurrentUrl(url);
      setCurrentPage(1);
      fetchData(url);
    },
    [buildUrlWithFilters, fetchData]
  );

  const clearFilters = useCallback(() => {
    setCurrentFilters(defaultFilters);
    const url = buildUrlWithFilters(defaultFilters);
    setCurrentUrl(url);
    setCurrentPage(1);
    fetchData(url);
  }, [buildUrlWithFilters, defaultFilters, fetchData]);

  const goToNextPage = useCallback(() => {
    if (nextUrl) {
      setCurrentUrl(nextUrl);
      setCurrentPage((prev) => prev + 1);
      fetchData(nextUrl);
    }
  }, [nextUrl, fetchData]);

  const goToPrevPage = useCallback(() => {
    if (prevUrl) {
      setCurrentUrl(prevUrl);
      setCurrentPage((prev) => prev - 1);
      fetchData(prevUrl);
    }
  }, [prevUrl, fetchData]);

  const goToPage = useCallback(
    (page: number) => {
      const url = buildUrlWithFilters(currentFilters, page);
      setCurrentUrl(url);
      setCurrentPage(page);
      fetchData(url);
    },
    [buildUrlWithFilters, currentFilters, fetchData]
  );

  const updateCurrentUrl = useCallback((url: string) => {
    setCurrentUrl(url);
    fetchData(url);
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    totalItems,
    currentPage,
    totalPages,
    nextUrl,
    prevUrl,
    fetchData,
    applyFilters,
    clearFilters,
    goToNextPage,
    goToPrevPage,
    goToPage,
    setCurrentUrl: updateCurrentUrl,
  };
}

export default useSearch;
