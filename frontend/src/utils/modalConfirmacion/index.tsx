import React, { useEffect } from "react";
import { lockBodyScroll, unlockBodyScroll } from "../scrollLock";

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
    if (!open) return;
    lockBodyScroll();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      unlockBodyScroll();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10000]">
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={onClose}></div>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-confirmacion-title"
        className="bg-white rounded-lg shadow-xl p-6 w-96 z-[10001] relative">
        <h3
          id="modal-confirmacion-title"
          className="text-xl font-bold text-center mb-2">
          Confirmar eliminación
        </h3>
        <hr className="my-3 border-gray-200" />
        <p className="text-gray-600 text-lg text-center mb-6">
          ¿Estás seguro? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-center space-x-4">
          {/* El botón seguro (Cancelar) va con estilo secundario y foco inicial;
              la acción destructiva queda en rojo */}
          <button
            autoFocus
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md font-medium">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacion;
