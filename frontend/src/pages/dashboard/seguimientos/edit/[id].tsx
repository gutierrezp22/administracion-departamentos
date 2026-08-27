import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import DashboardMenu from "../..";
import withAuth from "@/components/withAut";
import LoadingOverlay from "@/components/LoadingOverlay";
import SeguimientoForm, {
  aPayload,
  SeguimientoPayload,
  VACIO,
} from "@/components/Seguimientos/SeguimientoForm";

const EditarSeguimiento = () => {
  const router = useRouter();
  const { id } = router.query;
  const [valor, setValor] = useState<SeguimientoPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    API.get(`/facet/seguimiento/${id}/`)
      .then(({ data }) =>
        setValor({
          ...VACIO,
          docente: data.docente ?? "",
          tipo: data.tipo ?? "otro",
          descripcion: data.descripcion ?? "",
          fecha_novedad: data.fecha_novedad ?? "",
          fecha_resolucion: data.fecha_resolucion ?? "",
          responsable: data.responsable ?? "",
          prioridad: data.prioridad ?? "media",
          estado_seguimiento: data.estado_seguimiento ?? "pendiente",
          observaciones: data.observaciones ?? "",
          estado: data.estado ?? "1",
        })
      )
      .catch(() => setError("No se encontró el seguimiento."));
  }, [id]);

  const guardar = async () => {
    if (!valor) return;
    await API.put(`/facet/seguimiento/${id}/`, aPayload(valor));
    router.push("/dashboard/seguimientos");
  };

  if (error)
    return (
      <DashboardMenu>
        <div className="p-6 text-sm text-red-600">{error}</div>
      </DashboardMenu>
    );

  if (!valor)
    return (
      <DashboardMenu>
        <LoadingOverlay message="Cargando seguimiento…" />
      </DashboardMenu>
    );

  return (
    <DashboardMenu>
      <SeguimientoForm
        titulo={`Editar seguimiento #${id}`}
        valor={valor}
        onChange={setValor}
        onSubmit={guardar}
        textoBoton="Guardar cambios"
      />
    </DashboardMenu>
  );
};

export default withAuth(EditarSeguimiento);
