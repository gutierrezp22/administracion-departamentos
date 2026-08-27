import { useState } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import DashboardMenu from "../..";
import withAuth from "@/components/withAut";
import DesignacionForm, {
  aPayload,
  DesignacionPayload,
  VACIO,
} from "@/components/Designaciones/DesignacionForm";

const CrearDesignacion = () => {
  const router = useRouter();
  const [valor, setValor] = useState<DesignacionPayload>(VACIO);

  const guardar = async () => {
    await API.post("/facet/designacion/", aPayload(valor));
    router.push("/dashboard/designaciones");
  };

  return (
    <DashboardMenu>
      <DesignacionForm
        titulo="Nueva designación"
        valor={valor}
        onChange={setValor}
        onSubmit={guardar}
        textoBoton="Crear designación"
      />
    </DashboardMenu>
  );
};

export default withAuth(CrearDesignacion);
