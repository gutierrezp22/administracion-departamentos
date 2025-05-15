import React from "react";
import DashboardMenu from "../../dashboard";

const Home = () => {
  return (
    <DashboardMenu>
      <div className="flex justify-center py-8 px-4">
        <div className="w-full max-w-4xl">
          <div className="bg-white p-10 rounded-xl shadow-lg text-center">
            <h1 className="text-3xl font-extrabold text-indigo-600 mb-4">
              Bienvenido a la Gestión de Departamentos
            </h1>
            <h2 className="text-xl text-gray-600 mb-6">
              La plataforma para gestionar asignaturas, docentes, resoluciones y
              personas de manera eficiente y organizada.
            </h2>
            <div className="mt-6">
              <p className="text-gray-700">
                Utilice el menú de navegación para acceder a las secciones de
                administración. Estamos aquí para ayudarle a optimizar su flujo
                de trabajo y gestionar la información académica con facilidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardMenu>
  );
};

export default Home;
