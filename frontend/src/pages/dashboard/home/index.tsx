import React from "react";
import DashboardMenu from "../../dashboard";
import { Grid } from "@mui/material";

const Home = () => {
  return (
    <DashboardMenu>
      <div className="flex justify-center py-8 px-4">
        <div className="w-full max-w-6xl">
          <div className="bg-white p-10 rounded-xl shadow-lg text-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-600 mb-4">
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

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-md text-white h-full transition-transform hover:scale-105 duration-300">
                <h3 className="text-xl font-bold mb-3">Gestión de Personas</h3>
                <div className="border-t border-blue-400 pt-3">
                  <p className="text-blue-100 mb-4">
                    Administración de docentes, no docentes y jefes de
                    departamento.
                  </p>
                  <ul className="list-disc list-inside text-blue-100">
                    <li>Registro de información personal</li>
                    <li>Asignación de roles</li>
                    <li>Historial académico</li>
                  </ul>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={4}>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-md text-white h-full transition-transform hover:scale-105 duration-300">
                <h3 className="text-xl font-bold mb-3">
                  Gestión de Asignaturas
                </h3>
                <div className="border-t border-purple-400 pt-3">
                  <p className="text-purple-100 mb-4">
                    Control completo de la oferta académica del departamento.
                  </p>
                  <ul className="list-disc list-inside text-purple-100">
                    <li>Planificación de cursos</li>
                    <li>Asignación de docentes</li>
                    <li>Administración de carga horaria</li>
                  </ul>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} md={4}>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-md text-white h-full transition-transform hover:scale-105 duration-300">
                <h3 className="text-xl font-bold mb-3">Resoluciones</h3>
                <div className="border-t border-green-400 pt-3">
                  <p className="text-green-100 mb-4">
                    Digitalización y seguimiento de documentos oficiales.
                  </p>
                  <ul className="list-disc list-inside text-green-100">
                    <li>Registro de resoluciones</li>
                    <li>Designaciones docentes</li>
                    <li>Histórico de documentación</li>
                  </ul>
                </div>
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
    </DashboardMenu>
  );
};

export default Home;
