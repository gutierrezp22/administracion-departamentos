import React from "react";

interface SelectorButtonProps {
  label: string;
  onClick: () => void;
  selectedLabel?: string;
  selectedValue?: React.ReactNode;
}

const SelectorButton: React.FC<SelectorButtonProps> = ({
  label,
  onClick,
  selectedLabel,
  selectedValue,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg font-medium text-sm"
      >
        {label}
      </button>
      {selectedValue !== undefined && selectedValue !== null && selectedValue !== "" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 shadow-sm">
          <p className="text-sm font-medium text-gray-800">
            {selectedLabel && (
              <span className="font-bold text-blue-700">{selectedLabel}: </span>
            )}
            <span className="text-gray-900">{selectedValue}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SelectorButton;
