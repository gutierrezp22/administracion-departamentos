import { useEffect } from "react";
import { useRouter } from "next/router";

const CargosDepartamentoIndex = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/cargos-departamento/list");
  }, [router]);
  return null;
};

export default CargosDepartamentoIndex;
