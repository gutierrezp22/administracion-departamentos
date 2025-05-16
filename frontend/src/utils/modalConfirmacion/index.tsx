import React, { useEffect } from "react";

interface ModalConfirmacionProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ModalConfirmacion: React.FC<ModalConfirmacionProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (open) {
      // Prevent body scrolling when modal is open
      document.body.style.overflow = "hidden";
    } else {
      // Re-enable scrolling when modal is closed
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10000]">
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 z-[10001] relative">
        <h3 className="text-xl font-bold text-center mb-2">
          Confirmar Eliminación
        </h3>
        <hr className="my-3 border-gray-200" />
        <p className="text-gray-600 text-lg text-center mb-6">¿Estás seguro?</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md font-medium">
            Eliminar
          </button>
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacion;
