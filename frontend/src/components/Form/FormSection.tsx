import React from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, description, children }) => {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/40 p-5">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
};

export default FormSection;
