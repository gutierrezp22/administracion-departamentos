import React, { useEffect } from "react";

interface BasicModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  content: string;
}

const BasicModal: React.FC<BasicModalProps> = ({
  open,
  onClose,
  title,
  content,
  onConfirm = () => {},
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10000]">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 z-[10001] relative">
        <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
        <hr className="my-3 border-gray-200" />
        <p className="text-gray-600 text-lg text-center mb-6">{content}</p>
        <div className="flex justify-center">
          <button
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium"
          >
        OK
          </button>
        </div>
      </div>
    </div>
);
};

export default BasicModal;
