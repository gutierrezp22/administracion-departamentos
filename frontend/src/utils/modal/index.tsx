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
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 z-[10001] relative max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
        <hr className="my-3 border-gray-200" />
        <div className="text-gray-600 mb-6">
          {content.split('\n').map((line, index) => {
            // Si la línea contiene ":", es probablemente un error de campo específico
            const isFieldError = line.includes(':');
            return (
              <div key={index} className={`${index > 0 ? 'mt-3' : ''} ${isFieldError ? 'bg-red-50 border-l-4 border-red-400 p-3 rounded' : ''}`}>
                {isFieldError ? (
                  <div className="text-left">
                    <div className="flex">
                      <svg className="h-5 w-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-700 font-medium">{line}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-700">{line}</p>
                )}
              </div>
            );
          })}
        </div>
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
