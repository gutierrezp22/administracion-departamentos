"use client"; // Esto indica que el componente es del lado del cliente
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AppWrapper = () => {
  const router = useRouter();

  useEffect(() => {
    // El login guarda el token en sessionStorage (ver pages/login/index.tsx)
    const isAuthenticated = sessionStorage.getItem('access_token');

    if (isAuthenticated) {
      router.replace('/dashboard/home');
    } else {
      router.replace('/login');
    }
  }, [router]);

  // Mientras redirige, mostrar un loader consistente con el resto de la app
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
};

AppWrapper.displayName = "AppWrapper";
export default AppWrapper;
