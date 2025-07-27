"use client";

import { FormTemplate } from "./FormTemplate";
import { devApplicationSchema } from "@/lib/schemas";

interface DevFormProps {
  onContinue?: () => void;
  isLastDepartment?: boolean;
}

export default function DevForm({ onContinue, isLastDepartment = false }: DevFormProps) {
  return (
    <FormTemplate
      departmentId="dev"
      departmentDisplayName="Development"
      onContinue={onContinue}
      isLastDepartment={isLastDepartment}
      schema={devApplicationSchema}
    />
  );
} 