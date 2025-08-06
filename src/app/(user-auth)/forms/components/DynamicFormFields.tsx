"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { SkeletonForm } from "@/components/ui/loading";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'email';
  placeholder?: string;
  required: boolean;
  helperText?: string;
  departmentId: string;
  order: number;
}

interface DynamicFieldValue {
  value: string;
  label: string;
}

interface DynamicFormFieldsProps {
  departmentId: string;
  formValues: Record<string, string | DynamicFieldValue>;
  onChange: (fieldId: string, value: string, label?: string) => void;
}

export function DynamicFormFields({
  departmentId,
  formValues,
  onChange
}: DynamicFormFieldsProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load form fields for the department
  useEffect(() => {
    async function fetchFormFields() {
      if (!departmentId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Normalize department ID for Firestore query
        const normalizedDeptId = departmentId === 'ai-ml' ? 'aiMl' : 
                               departmentId === 'open-source' ? 'openSource' :
                               departmentId === 'game-dev' ? 'gameDev' :
                               departmentId === 'social-media' ? 'socialMedia' :
                               departmentId;
        
        // console.log(`Fetching form fields for department: ${departmentId} (normalized: ${normalizedDeptId})`);
        
        const fieldQuery = query(
          collection(db, "formFields"),
          where("departmentId", "==", departmentId)
        );
        
        const fieldsSnapshot = await getDocs(fieldQuery);
        
        if (fieldsSnapshot.empty) {
          // console.log(`No custom fields found for department: ${departmentId}`);
          // If no custom fields defined, use default fields
          setFields([]);
        } else {
          // Sort fields by label for consistent order
          const fieldsData = fieldsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FormField[];
          
          // console.log(`Loaded ${fieldsData.length} fields for department: ${departmentId}`, fieldsData);
          fieldsData.sort((a, b) => {
            // If both have order field, sort by order
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order;
            }
            // If only one has order, prioritize it
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            // Fallback to alphabetical for old fields without order
            return a.label.localeCompare(b.label);
          });
          setFields(fieldsData);
        }
      } catch (err) {
        console.error("Error loading form fields:", err);
        setError("Failed to load form questions. Please try again later.");
        toast.error("Failed to load form questions. Please refresh the page.", { id: `${departmentId}-fields-error` });
      } finally {
        setLoading(false);
      }
    }
    
    fetchFormFields();
  }, [departmentId]);

  // Validate field on blur
  const validateField = (field: FormField, value: string) => {
    if (field.required && (!value || value.trim() === '')) {
      setFieldErrors(prev => ({ ...prev, [field.id]: `${field.label} is required` }));
      return false;
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field.id];
        return newErrors;
      });
      return true;
    }
  };

  // Handle field change with validation
  const handleFieldChange = (field: FormField, value: string) => {
    onChange(field.id, value, field.label);
    validateField(field, value);
  };

  if (loading) {
    return <SkeletonForm fields={5} />;
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md backdrop-blur-sm">
        {error}
        <button 
          className="mt-2 text-sm underline"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="p-4 border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md backdrop-blur-sm">
        No form questions found for this department. Please try refreshing the page or contact support.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const fieldId = field.id;
        const fieldValue = formValues[fieldId];
        
        // Extract value based on format
        let value = '';
        if (typeof fieldValue === 'string') {
          value = fieldValue;
        } else if (fieldValue && typeof fieldValue === 'object' && 'value' in fieldValue) {
          value = fieldValue.value;
        }
        
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId} className="flex items-start">
              <span>{field.label}</span>
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            {field.type === "textarea" ? (
              <Textarea
                id={fieldId}
                value={value}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                onBlur={(e) => validateField(field, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                className={`bg-white/30 dark:bg-zinc-900/30 backdrop-blur-sm ${fieldErrors[fieldId] ? "border-red-500" : ""}`}
              />
            ) : (
              <Input
                id={fieldId}
                type={field.type}
                value={value}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                onBlur={(e) => validateField(field, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className={`bg-white/30 dark:bg-zinc-900/30 backdrop-blur-sm ${fieldErrors[fieldId] ? "border-red-500" : ""}`}
              />
            )}
            
            {fieldErrors[fieldId] && (
              <p className="text-sm text-red-500">{fieldErrors[fieldId]}</p>
            )}
            
            {field.helperText && !fieldErrors[fieldId] && (
              <p className="text-sm text-muted-foreground">{field.helperText}</p>
            )}
          </div>
        );
      })}
    </div>
  );
} 