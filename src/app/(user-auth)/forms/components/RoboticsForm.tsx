"use client";

import { FormTemplate } from "./FormTemplate";
import { roboticsApplicationSchema } from "@/lib/schemas";

interface RoboticsFormProps {
  onContinue?: () => void;
  isLastDepartment?: boolean;
}

export default function RoboticsForm({ onContinue, isLastDepartment = false }: RoboticsFormProps) {
  return (
    <FormTemplate
      departmentId="robotics"
      departmentDisplayName="Robotics & IoT"
      onContinue={onContinue}
      isLastDepartment={isLastDepartment}
      schema={roboticsApplicationSchema}
    />
  );
} 