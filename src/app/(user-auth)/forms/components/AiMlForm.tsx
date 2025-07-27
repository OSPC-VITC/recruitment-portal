"use client";

import { FormTemplate } from "./FormTemplate";
import { aiMlApplicationSchema } from "@/lib/schemas";

interface AiMlFormProps {
  onContinue?: () => void;
  isLastDepartment?: boolean;
}

export default function AiMlForm({ onContinue, isLastDepartment = false }: AiMlFormProps) {
  return (
    <FormTemplate
      departmentId="ai-ml"
      departmentDisplayName="AI & ML"
      onContinue={onContinue}
      isLastDepartment={isLastDepartment}
      schema={aiMlApplicationSchema}
    />
  );
} 