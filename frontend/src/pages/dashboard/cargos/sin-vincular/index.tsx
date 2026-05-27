import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import { TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import ResponsiveTable from "@/components/ResponsiveTable";
import LoadingOverlay from "@/components/LoadingOverlay";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LinkIcon from "@mui/icons-material/Link";
import Swal from "sweetalert2";
import DashboardMenu from "../..";
import withAuth from "@/components/withAut";
import VincularModal from "@/components/Cargos/VincularModal";

const normalizeUrl = (url: string) => {
  return url.replace(window.location.origin, "").replace(/^\/+/, "/");
};

interface Cargo {
  id: number;
  numero_de_cargo: number;
  tipo_cargo: number | null;
  tipo_cargo_detalle: {
    descripcion: string;
    dedicacion: string;
    sigla: string;
  } | null;
  cargo_departamento: number | null;
  cargo_departamento_detalle: {
    id: number;
    descripcion: string;
    departamento: { id: number; nombre: string } | null;
    asignatura: { id: number; codigo: string; nombre: string } | null;
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

const CargosSinVincular = () => {
  const router = useRouter();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    "/facet/cargo/sin-vincular/"
  );
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const [openVincular, setOpenVincular] = useState<Cargo | null>(null);

  const fetchData = async (url: string) => {
    try {
      setIsLoading(true);
      const r = await API.get(url);
      setCargos(r.data.results || r.data);
      setNextUrl(r.data.next ? normalizeUrl(r.data.next) : null);
      setPrevUrl(r.data.previous ? normalizeUrl(r.data.previous) : null);
      setTotalItems(r.data.count || (r.data.results?.length ?? r.data.length ?? 0));
    } catch (e) {
      Swal.fire("Error", "No se pudo cargar la lista.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <div className="p-6">
        <button
          onClick={() => router.push("/dashboard/cargos/list")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm">
          <ArrowBackIcon fontSize="small" /> Volver al listado
        </button>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">
              Cargos sin vincular
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Estos cargos (plata) fueron importados pero todavía no tienen
              un <strong>Cargo de Departamento</strong> asignado. Vinculá cada
              uno al Cargo de Departamento correspondiente (creálo desde su
              sección si todavía no existe).
            </p>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              <span className="text-sm font-medium text-orange-700">
                {totalItems} cargo{totalItems === 1 ? "" : "s"} pendiente{totalItems === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="relative">
              {isLoading && (
                <LoadingOverlay variant="overlay" message="Cargando..." />
              )}
              <ResponsiveTable dense>
                <TableHead>
                  <TableRow>
                    <TableCell>Nº Cargo</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Dedicación</TableCell>
                    <TableCell>Puntaje</TableCell>
                    <TableCell>Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cargos.map((c) => (
                    <TableRow key={c.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {c.numero_de_cargo}
                      </TableCell>
                      <TableCell>
                        {c.tipo_cargo_detalle
                          ? `${c.tipo_cargo_detalle.sigla || ""} ${c.tipo_cargo_detalle.descripcion}`.trim()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {c.tipo_cargo_detalle?.dedicacion || "—"}
                      </TableCell>
                      <TableCell>{c.puntaje ?? "—"}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => setOpenVincular(c)}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200 text-xs font-semibold">
                          <LinkIcon sx={{ fontSize: 16 }} /> Vincular
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {cargos.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <p className="text-gray-500 mb-1">
                          🎉 No hay cargos sin vincular.
                        </p>
                        <p className="text-xs text-gray-400">
                          Todos los cargos tienen un Cargo de Departamento asignado.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </ResponsiveTable>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => {
                    if (prevUrl) setCurrentUrl(prevUrl);
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={!prevUrl}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    prevUrl
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}>
                  Anterior
                </button>
                <span className="text-gray-600 font-medium">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <button
                  onClick={() => {
                    if (nextUrl) setCurrentUrl(nextUrl);
                    setCurrentPage((p) => p + 1);
                  }}
                  disabled={!nextUrl}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    nextUrl
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}>
                  Siguiente
                </button>
              </div>
            )}
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

export default withAuth(CargosSinVincular);
