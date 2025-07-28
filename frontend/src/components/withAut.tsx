import React, { useEffect } from "react";
import { useRouter } from "next/router";

const withAuth = (WrappedComponent: React.ComponentType) => {
  const AuthenticatedComponent = (props: any) => {
    const router = useRouter();

    useEffect(() => {
      const token = sessionStorage.getItem("access_token"); // Cambiar localStorage por sessionStorage

      if (!token) {
        router.replace("/login"); // Redirige al login si no está autenticado
      }
    }, [router]);

    return <WrappedComponent {...props} />;
  };

  // Agregar displayName para evitar el error
  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return AuthenticatedComponent;
};

export default withAuth;
