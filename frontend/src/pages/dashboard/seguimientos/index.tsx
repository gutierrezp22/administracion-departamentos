import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import { TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import ResponsiveTable from "@/components/ResponsiveTable";
import LoadingOverlay from "@/components/LoadingOverlay";
import Pagination from "@/components/Pagination";
import DashboardMenu from "../index";
import withAuth from "@/components/withAut";
import Swal from "sweetalert2";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneIcon from "@mui/icons-material/Done";
import {
  FilterContainer,
  FilterInput,
  FilterSelect,
  EstadoFilter,
} from "@/components/Filters";
import { Badge, fmtFecha } from "@/components/ReportePlanta/ui";
import { TIPOS, ESTADOS_SEG } from "@/components/Seguimientos/SeguimientoForm";

interface Seguimiento {
  id: number;
  docente_detalle: { apellido: string; nombre: string; dni: string } | null;
  tipo_display: string;
  descripcion: string;
  fecha_novedad: string;
  fecha_resolucion: string | null;
  responsable: string | null;
  prioridad: string;
  estado_seguimiento: string;
  estado_seguimiento_display: string;
  abierto: boolean;
  estado: string;
}

const LIMITE = 15;

const ListaSeguimientos = () => {
  const router = useRouter();
  const [items, setItems] = useState<Seguimiento[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [estadoSeg, setEstadoSeg] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [estado, setEstado] = useState("1");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params: Record<string, string | number> = { limit: LIMITE, offset };
      if (estado === "todos") params.show_all = "true";
      else if (estado) params.estado = estado;
      if (busqueda.trim()) params.search = busqueda.trim();
      if (tipo) params.tipo = tipo;
      if (estadoSeg) params.estado_seguimiento = estadoSeg;
      if (prioridad) params.prioridad = prioridad;

      const { data } = await API.get("/facet/seguimiento/", { params });
      setItems(data.results ?? []);
      setTotal(data.count ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setCargando(false);
    }
  }, [offset, estado, busqueda, tipo, estadoSeg, prioridad]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setOffset(0);
  }, [busqueda, tipo, estadoSeg, prioridad, estado]);

  const resolver = async (s: Seguimiento) => {
    const r = await Swal.fire({
      title: "¿Marcar como resuelto?",
      text: "Se registra con la fecha de hoy.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Marcar resuelto",
      cancelButtonText: "Cancelar",
    });
    if (!r.isConfirmed) return;
    try {
      await API.patch(`/facet/seguimiento/${s.id}/`, {
        estado_seguimiento: "resuelto",
        fecha_resolucion: new Date().toISOString().slice(0, 10),
      });
      cargar();
    } catch {
      Swal.fire("Error", "No se pudo actualizar el seguimiento.", "error");
    }
  };

  const eliminar = async (s: Seguimiento) => {
    const r = await Swal.fire({
      title: "¿Dar de baja el seguimiento?",
      text: "Queda inactivo, no se borra.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Dar de baja",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!r.isConfirmed) return;
    try {
      await API.delete(`/facet/seguimiento/${s.id}/`);
      cargar();
    } catch {
      Swal.fire("Error", "No se pudo dar de baja.", "error");
    }
  };

  const paginaActual = Math.floor(offset / LIMITE) + 1;
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE));

  return (
    <DashboardMenu>
      <div className="p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-blue-900">Seguimientos</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Novedades del departamento sobre cada docente: qué hay que hacer,
              quién es responsable y en qué estado está.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/seguimientos/create")}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <AddIcon fontSize="small" /> Nuevo seguimiento
          </button>
        </div>

        <FilterContainer onApply={cargar}>
          <FilterInput
            label="Buscar"
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Docente, novedad o responsable…"
            onEnterPress={cargar}
          />
          <FilterSelect
            label="Tipo"
            value={tipo}
            onChange={setTipo}
            options={[{ value: "", label: "Todos" }, ...TIPOS]}
          />
          <FilterSelect
            label="Estado del seguimiento"
            value={estadoSeg}
            onChange={setEstadoSeg}
            options={[{ value: "", label: "Todos" }, ...ESTADOS_SEG]}
          />
          <FilterSelect
            label="Prioridad"
            value={prioridad}
            onChange={setPrioridad}
            options={[
              { value: "", label: "Todas" },
              { value: "alta", label: "Alta" },
              { value: "media", label: "Media" },
              { value: "baja", label: "Baja" },
            ]}
          />
          <EstadoFilter value={estado} onChange={setEstado} />
        </FilterContainer>

        <div className="relative mt-4">
          {cargando && <LoadingOverlay variant="overlay" />}
          <ResponsiveTable dense>
            <TableHead>
              <TableRow>
                <TableCell>Docente</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Novedad</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Responsable</TableCell>
                <TableCell>Prioridad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 && !cargando && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <span className="text-sm text-gray-400 italic">
                      No hay seguimientos que cumplan el filtro.
                    </span>
                  </TableCell>
                </TableRow>
              )}
              {items.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    {s.docente_detalle
                      ? `${s.docente_detalle.apellido}, ${s.docente_detalle.nombre}`
                      : "—"}
                  </TableCell>
                  <TableCell>{s.tipo_display}</TableCell>
                  <TableCell>{s.descripcion}</TableCell>
                  <TableCell>{fmtFecha(s.fecha_novedad)}</TableCell>
                  <TableCell>{s.responsable ?? "—"}</TableCell>
                  <TableCell>
                    <Badge tipo={s.prioridad}>{s.prioridad}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge tipo={s.abierto ? "medio" : "vigente"}>
                      {s.estado_seguimiento_display}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex justify-end gap-1">
                      {s.abierto && (
                        <button
                          onClick={() => resolver(s)}
                          title="Marcar resuelto"
                          className="p-1 rounded hover:bg-emerald-50 text-emerald-600">
                          <DoneIcon fontSize="small" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          router.push(`/dashboard/seguimientos/edit/${s.id}`)
                        }
                        title="Editar"
                        className="p-1 rounded hover:bg-blue-50 text-blue-600">
                        <EditIcon fontSize="small" />
                      </button>
                      <button
                        onClick={() => eliminar(s)}
                        title="Dar de baja"
                        className="p-1 rounded hover:bg-red-50 text-red-600">
                        <DeleteIcon fontSize="small" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ResponsiveTable>
        </div>

        <Pagination
          currentPage={paginaActual}
          totalPages={totalPaginas}
          hasPrevious={offset > 0}
          hasNext={offset + LIMITE < total}
          onPrevious={() => setOffset(Math.max(0, offset - LIMITE))}
          onNext={() => setOffset(offset + LIMITE)}
        />
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaSeguimientos);
