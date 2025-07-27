"use client";

import { FormTemplate } from "./FormTemplate";
import { socialMediaApplicationSchema } from "@/lib/schemas";

interface SocialMediaFormProps {
  onContinue?: () => void;
  isLastDepartment?: boolean;
}

export default function SocialMediaForm({ onContinue, isLastDepartment = false }: SocialMediaFormProps) {
  return (
    <FormTemplate
      departmentId="social-media"
      departmentDisplayName="Social Media"
      onContinue={onContinue}
      isLastDepartment={isLastDepartment}
      schema={socialMediaApplicationSchema}
    />
  );
} 