"use client";

import { FormTemplate } from "./FormTemplate";
import { eventsApplicationSchema } from "@/lib/schemas";

interface EventsFormProps {
  onContinue?: () => void;
  isLastDepartment?: boolean;
}

export default function EventsForm({ onContinue, isLastDepartment = false }: EventsFormProps) {
  return (
    <FormTemplate
      departmentId="events"
      departmentDisplayName="Event Ops & Management"
      onContinue={onContinue}
      isLastDepartment={isLastDepartment}
      schema={eventsApplicationSchema}
    />
  );
} 