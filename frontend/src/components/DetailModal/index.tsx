import React, { useEffect } from "react";

interface DetailField {
  label: string;
  value: React.ReactNode;
}

interface DetailSection {
  title: string;
  fields: DetailField[];
}

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  title: string;
  sections: DetailSection[];
  showEditButton?: boolean;
}

/**
 * Componente modal unificado para mostrar detalles de una entidad.
 * Usado en las paginas de lista para ver informacion detallada sin navegar.
 */
const DetailModal: React.FC<DetailModalProps> = ({
  open,
  onClose,
  onEdit,
  title,
  sections,
  showEditButton = true,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[10000]"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto z-[10001] relative">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  {section.title}
                </h4>

                <div className="space-y-3">
                  {section.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex}>
                      <label className="text-sm font-medium text-gray-500">
                        {field.label}
                      </label>
                      {typeof field.value === "string" ||
                      typeof field.value === "number" ? (
                        <p className="text-gray-900 font-medium">
                          {field.value || "No especificado"}
                        </p>
                      ) : (
                        field.value
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Cerrar
          </button>
          {showEditButton && onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Componente auxiliar para mostrar el estado con badge de colores
 */
export const StatusBadge: React.FC<{ estado: string }> = ({ estado }) => (
  <span
    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
      estado === "1"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800"
    }`}
  >
    {estado === "1" ? "Activo" : "Inactivo"}
  </span>
);

export default DetailModal;
