"use client";

import { FormTemplate } from "./FormTemplate";
import { cybersecApplicationSchema } from "@/lib/schemas";

interface CybersecFormProps {
  onContinue?: () => void;
  isLastDepartment?: boolean;
}

export default function CybersecForm({ onContinue, isLastDepartment = false }: CybersecFormProps) {
  return (
    <FormTemplate
      departmentId="cybersec"
      departmentDisplayName="CyberSec & Blockchain"
      onContinue={onContinue}
      isLastDepartment={isLastDepartment}
      schema={cybersecApplicationSchema}
    />
  );
} 