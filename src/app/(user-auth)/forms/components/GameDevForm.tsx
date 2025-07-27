"use client";

import { FormTemplate } from "./FormTemplate";
import { gameDevApplicationSchema } from "@/lib/schemas";

interface GameDevFormProps {
  onContinue?: () => void;
  isLastDepartment?: boolean;
}

export default function GameDevForm({ onContinue, isLastDepartment = false }: GameDevFormProps) {
  return (
    <FormTemplate
      departmentId="gamedev"
      departmentDisplayName="Game Development"
      onContinue={onContinue}
      isLastDepartment={isLastDepartment}
      schema={gameDevApplicationSchema}
    />
  );
} 