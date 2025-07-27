"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicFormFields } from "./DynamicFormFields";
import { FormLayout } from "./FormLayout";
import { useAuth } from "@/lib/AuthContext";
import { useApplicationStore } from "@/lib/store";
import { z } from "zod";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Define the FormField interface
interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'email';
  placeholder?: string;
  required: boolean;
  helperText?: string;
  departmentId: string;
}

// Define the DynamicFieldValue interface
interface DynamicFieldValue {
  value: string;
  label: string;
}

// Form data type with dynamic fields
interface FormData {
  dynamicFields?: Record<string, string | DynamicFieldValue>;
}

interface FormTemplateProps {
  departmentId: string;
  departmentDisplayName: string;
  onContinue?: () => void;
  isLastDepartment?: boolean;
  schema: any;
}

export function FormTemplate({ 
  departmentId, 
  departmentDisplayName,
  onContinue, 
  isLastDepartment = false,
  schema
}: FormTemplateProps) {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  // Get the form functions from our store
  const { getFormData, updateFormData } = useApplicationStore();
  
  // Set up form with validation
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dynamicFields: {},
    },
    mode: "onBlur",
  });
  
  // Dynamic fields state
  const [dynamicFields, setDynamicFields] = useState<Record<string, DynamicFieldValue>>({});

  // Load form fields from Firestore
  useEffect(() => {
    async function loadFormFields() {
      if (!user?.uid) return;
      
      try {
        // console.log(`Loading form fields for department: ${departmentId}`);
        
        const fieldQuery = query(
          collection(db, "formFields"),
          where("departmentId", "==", departmentId)
        );
        
        const fieldsSnapshot = await getDocs(fieldQuery);
        
        if (!fieldsSnapshot.empty) {
          const fields = fieldsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FormField[];
          
          // console.log(`Loaded ${fields.length} fields for department: ${departmentId}`);
          fields.sort((a, b) => a.label.localeCompare(b.label));
          setFormFields(fields);
        } else {
          // console.log(`No form fields found for department: ${departmentId}`);
        }
      } catch (error) {
        // console.error("Error loading form fields:", error);
        toast.error(`Failed to load ${departmentDisplayName} form questions`, { id: `${departmentId}-load-error` });
      }
    }
    
    loadFormFields();
  }, [user, departmentId, departmentDisplayName]);

  // Load existing data from store
  useEffect(() => {
    async function loadFormData() {
      if (!user?.uid) return;
      
      try {
        const data = getFormData(departmentId);
        if (data) {
          // Set form values from store
          form.reset(data);
          
          // Set dynamic fields if they exist
          if (data.dynamicFields) {
            // Convert old format to new format if needed
            const convertedFields: Record<string, DynamicFieldValue> = {};
            
            for (const [key, value] of Object.entries(data.dynamicFields)) {
              if (typeof value === 'string') {
                // Old format - just the value as a string
                convertedFields[key] = {
                  value,
                  label: 'Custom Question'
                };
              } else if (typeof value === 'object' && value !== null && 'value' in value) {
                // New format with value and label
                convertedFields[key] = value as DynamicFieldValue;
              }
            }
            
            setDynamicFields(convertedFields);
          }
        }
      } catch (error) {
        console.error("Error loading form data:", error);
      } finally {
        setLoadingData(false);
      }
    }
    
    loadFormData();
  }, [user, form, getFormData, departmentId]);

  // Handle dynamic field changes
  const handleDynamicFieldChange = (fieldId: string, value: string, label?: string) => {
    setDynamicFields(prev => ({ 
      ...prev, 
      [fieldId]: {
        value,
        label: label || 'Custom Question'
      }
    }));
    setValidationError(undefined);
  };
  
  // Auto-save function
  const autoSaveForm = () => {
    const formData = form.getValues();
    
    // Create a properly typed form data object with dynamicFields
    const formDataWithDynamicFields = {
      ...formData,
      // Convert the dynamicFields to the format expected by the schema
      dynamicFields: Object.entries(dynamicFields).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, DynamicFieldValue>)
    };
    
    updateFormData(departmentId, formDataWithDynamicFields);
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 3000);
  };
  
  // Auto-save when fields change
  useEffect(() => {
    if (form.formState.isDirty || Object.keys(dynamicFields).length > 0) {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
      
      autoSaveTimeout.current = setTimeout(() => {
        autoSaveForm();
      }, 2000);
    }
    
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, [
    form.formState.isDirty,
    dynamicFields
  ]);
  
  // Validate the form before submission
  const validateForm = (): boolean => {
    // Check required fields
    const requiredFieldsMissing = formFields.some((field: FormField) => {
      if (field.required) {
        const fieldValue = dynamicFields[field.id];
        return !fieldValue || !fieldValue.value || fieldValue.value.trim() === '';
      }
      return false;
    });
    
    if (requiredFieldsMissing) {
      setValidationError("Please fill in all required fields marked with *");
      return false;
    }
    
    setValidationError(undefined);
    return true;
  };
  
  // Form submission handler
  async function onSubmit(data: FormData) {
    if (!user?.uid || !userData) {
      toast.error("You must be logged in to submit the form", { id: "auth-required" });
      return;
    }
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fill in all required fields", { id: "validation-error" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a properly typed form data object with dynamicFields
      const formDataWithDynamicFields = {
        ...data,
        // Convert the dynamicFields to the format expected by the schema
        dynamicFields: Object.entries(dynamicFields).reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, DynamicFieldValue>)
      };
      
      // Save to store with dynamic fields
      updateFormData(departmentId, formDataWithDynamicFields);
      
      toast.success(`Your ${departmentDisplayName} form has been saved!`, { id: `${departmentId}-form-saved` });
      
      if (isLastDepartment) {
        router.push("/review");
      } else {
        // If not the last department, the onContinue will handle navigation
        if (onContinue) onContinue();
      }
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error("Failed to save form data", { id: "form-save-error" });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Check if user has selected this department
  const userHasApplicableDepartment = userData?.departments?.includes(departmentId);

  if (loadingData) {
    return (
      <FormLayout 
        title="Loading..."
      >
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-t-2 border-blue-600 rounded-full animate-spin"></div>
        </div>
      </FormLayout>
    );
  }
  
  return (
    <FormLayout 
      title={`${departmentDisplayName} Department Application`}
      onContinue={onContinue}
      isLastDepartment={isLastDepartment}
      isSubmitting={isSubmitting}
      isDisabled={isSubmitting || loadingData}
      onSubmit={form.handleSubmit(onSubmit)}
      isLastForm={isLastDepartment}
      autoSaved={autoSaved}
      validationError={validationError}
    >
      {!userHasApplicableDepartment ? (
        <Card>
          <CardHeader>
            <CardTitle>Department Not Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need to select the {departmentDisplayName} department in your application to access this form.</p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/departments">Select Departments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Form {...form}>
          <form className="space-y-6">
            {/* Dynamic form fields from Firestore */}
            {formFields.length > 0 ? (
              <DynamicFormFields
                departmentId={departmentId}
                formValues={dynamicFields}
                onChange={handleDynamicFieldChange}
              />
            ) : (
              <Card className="bg-white/0 dark:bg-zinc-900/0 backdrop-blur-sm border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {loadingData 
                      ? "Loading form questions..." 
                      : "No custom questions found for this department."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Form submission error */}
            {form.formState.errors.root && (
              <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-md p-3 text-red-600 dark:text-red-400 text-sm backdrop-blur-sm">
                {form.formState.errors.root.message}
              </div>
            )}
          </form>
        </Form>
      )}
    </FormLayout>
  );
} 