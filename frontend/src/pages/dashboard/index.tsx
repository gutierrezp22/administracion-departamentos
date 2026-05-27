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
import WorkIcon from "@mui/icons-material/Work";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import API from "@/api/axiosConfig";
import ItemsMenu from "./components/itemsMenu";

// Define las propiedades del componente
interface DashboardMenuProps {
  children: React.ReactNode;
}

interface CustomMenuItemProps {
  icon: React.ReactNode;
  text?: string;
  onClick: () => void;
  badge?: number;
  active?: boolean;
}

const CustomMenuItem: React.FC<CustomMenuItemProps> = ({
  icon,
  text,
  onClick,
  badge,
  active,
}) => {
  return (
    <button
      onClick={onClick}
      title={!text ? (badge && badge > 0 ? `${text ?? ""} (${badge})` : undefined) : undefined}
      className={`group w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
        active
          ? "bg-white/15 backdrop-blur-sm shadow-inner ring-1 ring-white/10"
          : "hover:bg-white/10"
      }`}>
      {/* Indicador izquierdo cuando está activo */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
      )}
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center relative">
        <span
          className={`transition-colors duration-200 ${
            active ? "text-white" : "text-blue-100 group-hover:text-white"
          }`}>
          {icon}
        </span>
        {!text && badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md ring-2 ring-blue-600">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      {text && (
        <>
          <span
            className={`ml-3 flex-1 text-left text-sm transition-colors duration-200 ${
              active ? "text-white font-semibold" : "text-blue-50 group-hover:text-white font-medium"
            }`}>
            {text}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-2 min-w-[22px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </>
      )}
    </button>
  );
};

// ---------- Avatar con iniciales ----------
interface UserAvatarProps {
  name: string;
  size?: "sm" | "lg";
}
const UserAvatar: React.FC<UserAvatarProps> = ({ name, size = "sm" }) => {
  const initials = React.useMemo(() => {
    const trimmed = (name || "").trim();
    if (!trimmed) return "?";
    // Si es email, tomar la primera letra del local-part
    if (trimmed.includes("@")) return trimmed[0].toUpperCase();
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);
  const sizeClass = size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  const ringClass =
    size === "lg" ? "ring-2 ring-white/30" : "ring-2 ring-blue-100";
  return (
    <span
      className={`${sizeClass} ${ringClass} bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-sm`}>
      {initials}
    </span>
  );
};

// ---------- Breadcrumb dinámico desde la URL ----------
interface BreadcrumbProps {
  pathname: string;
  navigateTo: (path: string) => void;
}

// Mapeo de segmentos URL a etiquetas amigables
const PATH_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  home: "Inicio",
  resoluciones: "Resoluciones",
  persons: "Personas",
  docentes: "Docentes",
  jefes: "Jefes",
  noDocentes: "No Docentes",
  departments: "Departamentos",
  departamentoJefe: "Jefes de Departamento",
  areas: "Áreas",
  asignatura: "Asignaturas",
  docenteAsignatura: "Docentes en Asignatura",
  careers: "Carreras",
  asignaturaCarrera: "Asignaturas en Carrera",
  cargos: "Cargos",
  "cargos-departamento": "Cargos de Departamento",
  "sin-vincular": "Sin vincular",
  historial: "Historial",
  notificaciones: "Notificaciones",
  usuarios: "Usuarios",
  create: "Crear",
  edit: "Editar",
  list: "Listado",
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ pathname, navigateTo }) => {
  const segments = pathname.split("/").filter(Boolean);
  // Omitir el primer "dashboard" porque lo mostramos siempre como root
  if (segments[0] === "dashboard") segments.shift();

  // Construir crumbs: omitir segmentos que son ids ([id], números, uuids)
  const crumbs: { label: string; path: string }[] = [];
  let acc = "/dashboard";
  segments.forEach((seg) => {
    acc += `/${seg}`;
    // Saltar segmentos dinámicos tipo [id], números puros, etc.
    if (seg.startsWith("[") && seg.endsWith("]")) return;
    if (/^\d+$/.test(seg)) return;
    const label =
      PATH_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
    crumbs.push({ label, path: acc });
  });

  if (crumbs.length === 0) {
    return (
      <h1 className="text-base font-semibold text-gray-800">Dashboard</h1>
    );
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <React.Fragment key={c.path}>
            {i > 0 && (
              <span className="text-gray-300 select-none">/</span>
            )}
            {isLast ? (
              <span className="font-semibold text-gray-800">{c.label}</span>
            ) : (
              <button
                onClick={() => navigateTo(c.path)}
                className="text-gray-500 hover:text-blue-600 transition-colors duration-200">
                {c.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

const DashboardMenu: React.FC<DashboardMenuProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [cargosPendientes, setCargosPendientes] = useState<number>(0);
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

    // Conteo de cargos pendientes de vincular (para badge en el sidebar).
    // Si falla la request no rompe nada — simplemente no muestra el badge.
    const fetchPendientes = async () => {
      try {
        const r = await API.get("/facet/cargo/?cargo_departamento__isnull=True&estado=1&page_size=1");
        setCargosPendientes(r.data.count ?? 0);
      } catch {
        // ignore
      }
    };
    fetchPendientes();
    // Refresco cada 60s en caso de que otro usuario haya vinculado mientras tanto
    const id = setInterval(fetchPendientes, 60000);
    return () => clearInterval(id);
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
      icon: <WorkIcon />,
      text: "Cargos de Departamento",
      path: "/dashboard/cargos-departamento/list",
    },
    {
      icon: <AssignmentLateIcon />,
      text: "Cargos sin vincular",
      path: "/dashboard/cargos/sin-vincular",
      badge: cargosPendientes,
    },
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

  // Determinar si una ruta del menú está activa según la URL actual
  const isItemActive = (itemPath: string): boolean => {
    if (!router.pathname) return false;
    // Match exacto o prefijo (para que /cargos/list active "Cargos" pero no
    // active simultáneamente "Cargos pendientes")
    if (router.pathname === itemPath) return true;
    // Prefijo más largo gana: se evalúa después con priorización
    return router.pathname.startsWith(itemPath + "/");
  };

  // Calcular cuál item es el activo: el de path más largo que matchea
  const activeItemPath = menuItems
    .filter((i) => isItemActive(i.path))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          open ? "w-64" : "w-16"
        } bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-xl transition-all duration-300 ease-in-out z-20 flex flex-col`}>
        {/* Header del sidebar */}
        <div className="flex justify-between items-center px-4 py-4 border-b border-white/10">
          {open ? (
            <span className="font-bold text-lg tracking-wide text-white">
              FACET
            </span>
          ) : (
            <span></span>
          )}
          <button
            onClick={toggleDrawer}
            className="p-1.5 rounded-lg hover:bg-white/15 transition-colors duration-200 text-white">
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </button>
        </div>
        {/* Lista de items, scrollable */}
        <div className="flex-1 overflow-y-auto px-2 py-3 sidebar-scroll">
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <CustomMenuItem
                key={index}
                icon={item.icon}
                text={open ? item.text : undefined}
                badge={item.badge}
                active={item.path === activeItemPath}
                onClick={() => navigateTo(item.path)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-10 sticky top-0">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Izquierda: Logo + Breadcrumb */}
            <div className="flex items-center gap-4">
              <Image
                src="/logoFACET.png"
                alt="Logo FACET"
                width={140}
                height={42}
                className="h-10 w-auto"
                unoptimized={true}
              />
              <div className="hidden md:block h-8 w-px bg-gray-200" />
              <Breadcrumb pathname={router.pathname} navigateTo={navigateTo} />
            </div>

            {/* Derecha: usuario */}
            <div className="relative">
              <button
                onClick={handleMenuOpen}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group">
                <div className="hidden md:flex flex-col items-end leading-tight">
                  <span className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
                    {userName && userName !== "Usuario" ? userName : (userEmail || "Usuario")}
                  </span>
                  {userEmail && userEmail !== userName && (
                    <span className="text-xs text-gray-500 truncate max-w-[180px]">
                      {userEmail}
                    </span>
                  )}
                </div>
                <UserAvatar name={userName || userEmail} />
              </button>

              {userMenuOpen && (
                <>
                  {/* Backdrop para cerrar al click fuera */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={handleMenuClose}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200/60 z-50 overflow-hidden">
                    {/* Header del dropdown con avatar grande */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-4 text-white">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={userName || userEmail} size="lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">
                            {userName || "Usuario"}
                          </p>
                          {userEmail && (
                            <p className="text-xs text-blue-100 truncate">{userEmail}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Items */}
                    <div className="p-2">
                      <button
                        onClick={handleChangePassword}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                        <span className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                          <LockIcon sx={{ fontSize: 18 }} />
                        </span>
                        <span className="font-medium">Cambiar contraseña</span>
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors duration-200">
                        <span className="p-1.5 bg-red-50 rounded-lg text-red-600">
                          <LogoutIcon sx={{ fontSize: 18 }} />
                        </span>
                        <span className="font-medium">Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                </>
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
