import { useEffect } from "react";
import { useRouter } from "next/router";

const CargosIndex = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/cargos/list");
  }, [router]);
  return null;
};

export default CargosIndex;
