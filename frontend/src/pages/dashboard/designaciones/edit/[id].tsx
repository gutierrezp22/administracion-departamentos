import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import DashboardMenu from "../..";
import withAuth from "@/components/withAut";
import LoadingOverlay from "@/components/LoadingOverlay";
import DesignacionForm, {
  aPayload,
  DesignacionPayload,
  VACIO,
} from "@/components/Designaciones/DesignacionForm";

const EditarDesignacion = () => {
  const router = useRouter();
  const { id } = router.query;
  const [valor, setValor] = useState<DesignacionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    API.get(`/facet/designacion/${id}/`)
      .then(({ data }) =>
        setValor({
          ...VACIO,
          docente: data.docente ?? "",
          tipo: data.tipo ?? "DI_GENUINO",
          tipo_cargo: data.tipo_cargo ?? "",
          codigo_cargo: data.codigo_cargo ?? "",
          cargo_departamento: data.cargo_departamento ?? "",
          area: data.area ?? "",
          asignatura: data.asignatura ?? "",
          resolucion: data.resolucion ?? "",
          tipo_instrumento: data.tipo_instrumento ?? "",
          expediente: data.expediente ?? "",
          nro_resolucion: data.nro_resolucion ?? "",
          dgpres: data.dgpres ?? "",
          fecha_desde: data.fecha_desde ?? "",
          fecha_hasta: data.fecha_hasta ?? "",
          en_tramite: !!data.en_tramite,
          renuncia_definitiva: !!data.renuncia_definitiva,
          rol_gestion: data.rol_gestion ?? "",
          observaciones: data.observaciones ?? "",
          estado: data.estado ?? "1",
        })
      )
      .catch(() => setError("No se encontró la designación."));
  }, [id]);

  const guardar = async () => {
    if (!valor) return;
    await API.put(`/facet/designacion/${id}/`, aPayload(valor));
    router.push("/dashboard/designaciones");
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
        <LoadingOverlay message="Cargando designación…" />
      </DashboardMenu>
    );

  return (
    <DashboardMenu>
      <DesignacionForm
        titulo={`Editar designación #${id}`}
        valor={valor}
        onChange={setValor}
        onSubmit={guardar}
        textoBoton="Guardar cambios"
      />
    </DashboardMenu>
  );
};

export default withAuth(EditarDesignacion);
