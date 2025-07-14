import React from "react";
import { useRouter } from "next/router";
import CrearUsuario from "./create";
import ListaUsuarios from "./list";
import EditarUsuario from "./edit/[id]";

const Usuarios = () => {
  const router = useRouter();
  const { path, id } = router.query;

  const renderContent = () => {
    if (!path) return <ListaUsuarios />;

    switch (path) {
      case "crear":
        return <CrearUsuario />;
      case "editar":
        return <EditarUsuario id={id as string} />;
      default:
        return <ListaUsuarios />;
    }
  };

  return <div>{renderContent()}</div>;
};

export default Usuarios;
