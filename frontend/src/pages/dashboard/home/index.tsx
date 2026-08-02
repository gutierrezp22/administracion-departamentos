import React from "react";
import { useRouter } from "next/router";
import DashboardMenu from "../../dashboard";
import withAuth from "@/components/withAut";
import {
  FiUsers,
  FiBookOpen,
  FiFileText,
  FiArrowRight,
  FiBriefcase,
  FiLayers,
  FiAward,
} from "react-icons/fi";

type FeatureCardProps = {
  icon: React.ReactNode;
  accent: string;
  iconBg: string;
  title: string;
  description: string;
  bullets: string[];
  href?: string;
};

const Home = () => {
  const router = useRouter();

  const features: FeatureCardProps[] = [
    {
      icon: <FiUsers className="h-6 w-6" />,
      accent: "text-blue-600",
      iconBg: "bg-blue-50 text-blue-600 ring-blue-100",
      title: "Gestión de Personas",
      description:
        "Administración de docentes, no docentes y jefes de departamento.",
      bullets: [
        "Registro de información personal",
        "Asignación de roles",
        "Historial académico",
      ],
      href: "/dashboard/persons/list",
    },
    {
      icon: <FiBookOpen className="h-6 w-6" />,
      accent: "text-indigo-600",
      iconBg: "bg-indigo-50 text-indigo-600 ring-indigo-100",
      title: "Gestión de Asignaturas",
      description:
        "Control completo de la oferta académica del departamento.",
      bullets: [
        "Planificación de cursos",
        "Asignación de docentes",
        "Administración de carga horaria",
      ],
      href: "/dashboard/asignatura/list",
    },
    {
      icon: <FiFileText className="h-6 w-6" />,
      accent: "text-emerald-600",
      iconBg: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      title: "Resoluciones",
      description: "Digitalización y seguimiento de documentos oficiales.",
      bullets: [
        "Registro de resoluciones",
        "Designaciones docentes",
        "Histórico de documentación",
      ],
      href: "/dashboard/resoluciones/list",
    },
  ];

  return (
    <DashboardMenu>
      <div className="min-h-full bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-8">
          {/* Hero panel */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-xl">
            {/* Patrón decorativo */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-400 mix-blend-overlay blur-3xl" />
              <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-400 mix-blend-overlay blur-3xl" />
              <div className="absolute top-1/2 left-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 mix-blend-overlay blur-3xl" />
            </div>

            {/* Grid sutil */}
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16 text-white">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-[11px] font-semibold tracking-wide uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  Panel principal
                </span>
                <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                  Bienvenido a la Gestión
                  <br />
                  <span className="text-blue-200">de Departamentos</span>
                </h1>
                <p className="mt-4 text-base sm:text-lg text-blue-100/90 leading-relaxed max-w-2xl">
                  Plataforma integral para administrar asignaturas, docentes,
                  resoluciones y personas de la Facultad de Ciencias Exactas y
                  Tecnología.
                </p>

                <div className="mt-7 flex flex-wrap gap-2.5">
                  <FeatureChip icon={<FiBriefcase className="h-3.5 w-3.5" />} text="Cargos docentes" />
                  <FeatureChip icon={<FiFileText className="h-3.5 w-3.5" />} text="Resoluciones" />
                  <FeatureChip icon={<FiAward className="h-3.5 w-3.5" />} text="Asignaturas" />
                  <FeatureChip icon={<FiLayers className="h-3.5 w-3.5" />} text="Departamentos" />
                </div>
              </div>
            </div>
          </section>

          {/* Encabezado de sección */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Módulos disponibles
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Accedé rápidamente a las secciones más utilizadas del sistema.
              </p>
            </div>
          </div>

          {/* Tarjetas de módulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <FeatureCard
                key={f.title}
                {...f}
                onClick={f.href ? () => router.push(f.href!) : undefined}
              />
            ))}
          </div>

          {/* Pie sutil */}
          <p className="text-center text-xs text-gray-500 pt-2">
            Usá el menú lateral para acceder al resto de las secciones del
            sistema.
          </p>
        </div>
      </div>
    </DashboardMenu>
  );
};

const FeatureChip: React.FC<{ icon: React.ReactNode; text: string }> = ({
  icon,
  text,
}) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium text-white">
    {icon}
    {text}
  </span>
);

const FeatureCard: React.FC<FeatureCardProps & { onClick?: () => void }> = ({
  icon,
  iconBg,
  accent,
  title,
  description,
  bullets,
  onClick,
}) => {
  const interactive = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`group relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col h-full transition-all duration-200 ${
        interactive
          ? "cursor-pointer hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          : ""
      }`}>
      <div className="flex items-start justify-between">
        <div
          className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ring-1 ${iconBg}`}>
          {icon}
        </div>
        {interactive && (
          <FiArrowRight
            className={`h-5 w-5 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:${accent}`}
          />
        )}
      </div>

      <h3 className="mt-5 text-lg font-semibold text-gray-900 tracking-tight">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
        {description}
      </p>

      <ul className="mt-4 pt-4 border-t border-gray-100 space-y-2">
        {bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2 text-sm text-gray-700">
            <span
              className={`mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-300 flex-shrink-0 group-hover:bg-current ${accent}`}
              aria-hidden
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default withAuth(Home);
