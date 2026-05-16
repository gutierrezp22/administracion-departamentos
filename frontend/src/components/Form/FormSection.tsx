import React from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Sección de formulario con el mismo estilo visual que FilterContainer:
 * gradient sutil, rounded-2xl, border y shadow. Header con chip de ícono opcional.
 */
const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  icon,
  children,
}) => {
  return (
    <section className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-sm border border-gray-200/60 p-5">
      <header className="flex items-center gap-2 mb-4">
        {icon && (
          <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
};

export default FormSection;
