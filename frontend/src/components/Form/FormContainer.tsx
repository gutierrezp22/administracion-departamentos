import React from "react";
import { Container } from "@mui/material";

interface FormContainerProps {
  title: string;
  subtitle?: string;
  maxWidth?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const FormContainer: React.FC<FormContainerProps> = ({
  title,
  subtitle,
  maxWidth = "md",
  children,
}) => {
  return (
    <Container maxWidth={maxWidth}>
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-6">{children}</div>
        </div>
      </div>
    </Container>
  );
};

export default FormContainer;
