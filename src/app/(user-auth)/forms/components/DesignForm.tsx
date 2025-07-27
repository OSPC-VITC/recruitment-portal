"use client";

import { FormTemplate } from "./FormTemplate";
import { designApplicationSchema } from "@/lib/schemas";

interface DesignFormProps {
  onContinue?: () => void;
  isLastDepartment?: boolean;
}

export default function DesignForm({ onContinue, isLastDepartment = false }: DesignFormProps) {
  return (
    <FormTemplate
      departmentId="design"
      departmentDisplayName="Design & Content"
      onContinue={onContinue}
      isLastDepartment={isLastDepartment}
      schema={designApplicationSchema}
    />
  );
} 