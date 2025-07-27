"use client";

import { FormTemplate } from "./FormTemplate";
import { openSourceApplicationSchema } from "@/lib/schemas";

interface OpenSourceFormProps {
  onContinue?: () => void;
  isLastDepartment?: boolean;
}

export default function OpenSourceForm({ onContinue, isLastDepartment = false }: OpenSourceFormProps) {
  return (
    <FormTemplate
      departmentId="opensource"
      departmentDisplayName="Open Source & Research"
      onContinue={onContinue}
      isLastDepartment={isLastDepartment}
      schema={openSourceApplicationSchema}
    />
  );
} 