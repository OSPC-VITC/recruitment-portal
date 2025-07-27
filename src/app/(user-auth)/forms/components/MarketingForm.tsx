"use client";

import { FormTemplate } from "./FormTemplate";
import { marketingApplicationSchema } from "@/lib/schemas";

interface MarketingFormProps {
  onContinue?: () => void;
  isLastDepartment?: boolean;
}

export default function MarketingForm({ onContinue, isLastDepartment = false }: MarketingFormProps) {
  return (
    <FormTemplate
      departmentId="marketing"
      departmentDisplayName="Marketing"
      onContinue={onContinue}
      isLastDepartment={isLastDepartment}
      schema={marketingApplicationSchema}
    />
  );
} 