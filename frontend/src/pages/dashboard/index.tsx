import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import LockIcon from "@mui/icons-material/Lock";
import HomeIcon from "@mui/icons-material/Home";
import ArticleIcon from "@mui/icons-material/Article";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import ViewComfyIcon from "@mui/icons-material/ViewComfy";
import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import SchoolIcon from "@mui/icons-material/School";
import EmailIcon from "@mui/icons-material/Email";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ItemsMenu from "./components/itemsMenu";

// Define las propiedades del componente
interface DashboardMenuProps {
  children: React.ReactNode;
}

interface CustomMenuItemProps {
  icon: React.ReactNode;
  text?: string;
  onClick: () => void;
}

const CustomMenuItem: React.FC<CustomMenuItemProps> = ({
  icon,
  text,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center p-3 hover:bg-blue-400 rounded-md transition-colors duration-200">
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
        {icon}
      </div>
      {text && <span className="ml-4 text-white">{text}</span>}
    </button>
  );
};

const DashboardMenu: React.FC<DashboardMenuProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const router = useRouter();

  // Initialize sidebar state from localStorage when component mounts
  useEffect(() => {
    // Try to get saved state from localStorage
    const savedState = localStorage.getItem("sidebarOpen");
    // Set the initial state based on saved value (or false if no saved value)
    setOpen(savedState === "true");
    
    // Cargar información del usuario desde sessionStorage
    const storedUserName = sessionStorage.getItem("user_name");
    const storedUserEmail = sessionStorage.getItem("user_email");
    if (storedUserName) {
      setUserName(storedUserName);
    }
    if (storedUserEmail) {
      setUserEmail(storedUserEmail);
    }
  }, []);

  const handleMenuOpen = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleMenuClose = () => {
    setUserMenuOpen(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user_email");
    sessionStorage.removeItem("user_name");
    sessionStorage.removeItem("user_rol");
    router.push("/login");
  };

  const handleChangePassword = () => {
    setUserMenuOpen(false);
    router.push("/dashboard/change-password");
  };

  const toggleDrawer = () => {
    const newState = !open;
    setOpen(newState);
    // Save state to localStorage
    localStorage.setItem("sidebarOpen", newState.toString());
  };

  const navigateTo = (path: string) => {
    // Close the user menu if it's open when navigating
    if (userMenuOpen) {
      setUserMenuOpen(false);
    }
    router.push(path);
  };

  const menuItems = [
    { icon: <HomeIcon />, text: "Inicio", path: "/dashboard/home" },
    {
      icon: <ArticleIcon />,
      text: "Resoluciones",
      path: "/dashboard/resoluciones",
    },
    { icon: <PeopleIcon />, text: "Personas", path: "/dashboard/persons" },
    {
      icon: <ViewComfyIcon />,
      text: "Departamentos",
      path: "/dashboard/departments",
    },
    { icon: <AutoAwesomeMotionIcon />, text: "Area", path: "/dashboard/areas" },
    {
      icon: <NoteAltIcon />,
      text: "Asignaturas",
      path: "/dashboard/asignatura",
    },
    { icon: <SchoolIcon />, text: "Carreras", path: "/dashboard/careers" },
    {
      icon: <EmailIcon />,
      text: "Notificaciones",
      path: "/dashboard/notificaciones",
    },
    {
      icon: <PersonIcon />,
      text: "Usuarios",
      path: "/dashboard/usuarios",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          open ? "w-64" : "w-16"
        } bg-blue-500 text-white shadow-lg transition-all duration-300 ease-in-out z-20`}>
        <div className="flex justify-between items-center p-4">
          {open ? (
            <span className="font-bold text-xl">Menu</span>
          ) : (
            <span></span>
          )}
          <button
            onClick={toggleDrawer}
            className="p-2 rounded-full hover:bg-blue-400 transition-colors duration-200 text-white">
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </button>
        </div>
        <div className="px-2 py-2">
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <CustomMenuItem
                key={index}
                icon={item.icon}
                text={open ? item.text : undefined}
                onClick={() => navigateTo(item.path)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="bg-white shadow-md z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Image
                src="/logoFACET.png"
                alt="Logo FACET"
                width={160}
                height={50}
                className="h-12 w-auto"
                unoptimized={true}
              />
              <div className="hidden md:flex flex-col justify-center">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-2 shadow-sm border border-blue-100">
                  <p className="text-sm font-bold text-blue-800 tracking-wide">
                    {userName && userName !== "Usuario" ? userName : (userEmail || "Usuario")}
                  </p>
                  {userEmail && userEmail !== userName && (
                    <p className="text-xs text-blue-600 font-medium opacity-80">{userEmail}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={handleMenuOpen}
                className="p-2 text-blue-500 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 hover:scale-110">
                <AccountCircleIcon className="w-8 h-8" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                  {userName && (
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                      {userEmail && (
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleChangePassword}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                    <LockIcon className="mr-2 text-gray-500" />
                    Cambiar contraseña
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200">
                    <LogoutIcon className="mr-2 text-red-500" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}

          {/* Botón Volver Atrás */}
          {router.pathname !== "/dashboard/home" && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-md shadow-md transition-colors duration-200 font-medium">
                <ArrowBackIcon />
                Volver Atrás
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardMenu;
