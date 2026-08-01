import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

const withAuth = (WrappedComponent: React.ComponentType) => {
  const AuthenticatedComponent = (props: any) => {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      const token = sessionStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
      } else {
        setIsAuthorized(true);
      }
    }, [router]);

    // No renderizar el contenido protegido hasta confirmar la sesión:
    // evita el "flash" del dashboard y las llamadas a la API sin token
    if (!isAuthorized) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  // Agregar displayName para evitar el error
  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return AuthenticatedComponent;
};

export default withAuth;
