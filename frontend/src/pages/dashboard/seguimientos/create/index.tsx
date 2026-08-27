import { useState } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import DashboardMenu from "../..";
import withAuth from "@/components/withAut";
import SeguimientoForm, {
  aPayload,
  SeguimientoPayload,
  VACIO,
} from "@/components/Seguimientos/SeguimientoForm";

const CrearSeguimiento = () => {
  const router = useRouter();
  const [valor, setValor] = useState<SeguimientoPayload>(VACIO);

  const guardar = async () => {
    await API.post("/facet/seguimiento/", aPayload(valor));
    router.push("/dashboard/seguimientos");
  };

  return (
    <DashboardMenu>
      <SeguimientoForm
        titulo="Nuevo seguimiento"
        valor={valor}
        onChange={setValor}
        onSubmit={guardar}
        textoBoton="Crear seguimiento"
      />
    </DashboardMenu>
  );
};

export default withAuth(CrearSeguimiento);
