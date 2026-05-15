import React from "react";

type Variant = "primary" | "success" | "secondary";

interface FormActionsProps {
  children: React.ReactNode;
  align?: "center" | "end" | "between";
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = "center",
}) => {
  const alignClass =
    align === "center"
      ? "justify-center"
      : align === "end"
      ? "justify-end"
      : "justify-between";
  return (
    <div
      className={`flex ${alignClass} items-center gap-3 pt-2 border-t border-gray-100`}
    >
      {children}
    </div>
  );
};

interface FormButtonProps {
  onClick: () => void;
  variant?: Variant;
  disabled?: boolean;
  type?: "button" | "submit";
  children: React.ReactNode;
}

export const FormButton: React.FC<FormButtonProps> = ({
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  children,
}) => {
  const styles: Record<Variant, string> = {
    primary:
      "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white",
    success:
      "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white",
    secondary:
      "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles[variant]} px-6 py-2.5 rounded-lg shadow-md transition-all duration-200 transform hover:scale-[1.02] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
    >
      {children}
    </button>
  );
};

export default FormActions;
