"use client";

import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Save, 
  PenLine,
  FileText,
  Check,
  X
} from "lucide-react";
import { DEPARTMENTS } from "@/types";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  where,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { toast } from "sonner";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { departmentToFirestoreId, getDepartmentName as getAdminDeptName } from "@/lib/adminConfig";
import { Loading, SkeletonTable } from "@/components/ui/loading";

// Form fields interface for all departments
interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'email';
  placeholder?: string;
  required: boolean;
  helperText?: string;
  options?: string[];
  departmentId: string;
  order: number; // New field for ordering questions
  createdAt?: any;
  updatedAt?: any;
}

export default function AdminQuestionsPage() {
  const { isCoreTeam, department } = useAdminAuth();
  const departmentId = department ? departmentToFirestoreId[department] : null;
  
  const [availableDepartments, setAvailableDepartments] = useState<Array<{id: string, name: string}>>([]);
  const [activeDepartment, setActiveDepartment] = useState("");
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New field state
  const [newField, setNewField] = useState<Omit<FormField, 'id'>>({
    label: "",
    type: "text",
    placeholder: "",
    required: true,
    helperText: "",
    departmentId: "",
    order: 1 // Default order value, will be updated when fields load
  });
  
  // Edit field
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  
  // Helper function to get the next order number
  const getNextOrderNumber = () => {
    if (formFields.length === 0) return 1;
    const maxOrder = Math.max(...formFields.map(f => f.order).filter(o => o !== undefined));
    return maxOrder + 1;
  };
  
  // Initialize available departments based on user role
  useEffect(() => {
    // For department leads, only show their department
    if (!isCoreTeam && departmentId) {
      const deptName = Object.entries(DEPARTMENTS).find(([id, _]) => id === departmentId)?.[1] || departmentId;
      setAvailableDepartments([{ id: departmentId, name: deptName.toString() }]);
      setActiveDepartment(departmentId);
      setNewField(prev => ({ ...prev, departmentId }));
    } else {
      // For core team, show all departments
      const allDepts = Object.entries(DEPARTMENTS).map(([id, name]) => ({
        id,
        name: name.toString()
      }));
      setAvailableDepartments(allDepts);
      setActiveDepartment(allDepts[0]?.id || "");
      setNewField(prev => ({ ...prev, departmentId: allDepts[0]?.id || "" }));
    }
  }, [isCoreTeam, departmentId]);
  
  // Load form fields for the selected department
  useEffect(() => {
    async function fetchFormFields() {
      if (!activeDepartment) return;
      
      setLoading(true);
      try {
        const fieldQuery = query(
          collection(db, "formFields"),
          where("departmentId", "==", activeDepartment)
        );
        
        const fieldsSnapshot = await getDocs(fieldQuery);
        const fieldsData = fieldsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FormField[];
        
        // Sort fields by order, then by label as fallback
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
        
        setFormFields(fieldsData);
        
        // Update the newField order to be next in sequence
        const nextOrder = fieldsData.length === 0 ? 1 : Math.max(...fieldsData.map(f => f.order).filter(o => o !== undefined)) + 1;
        setNewField(prev => ({ ...prev, order: nextOrder }));
      } catch (error) {
        console.error("Error fetching form fields:", error);
        toast.error("Unable to load form questions", { id: "admin-questions-load-error" });
      } finally {
        setLoading(false);
      }
    }
    
    if (activeDepartment) {
      fetchFormFields();
    }
  }, [activeDepartment]);
  
  // Handle department change (only for core team)
  const handleDepartmentChange = (departmentId: string) => {
    if (isCoreTeam) {
      setActiveDepartment(departmentId);
      // Update the new field's department and reset order
      const nextOrder = getNextOrderNumber();
      setNewField(prev => ({ ...prev, departmentId, order: nextOrder }));
    }
  };
  
  // Handle adding a new field
  const handleAddField = async () => {
    if (!newField.label.trim()) {
      toast.error("Question label is required", { id: "admin-question-label-required" });
      return;
    }
    
    setSaving(true);
    try {
      // Generate a unique field ID
      const fieldId = `${activeDepartment}_${Date.now()}`;
      
      // Add field to Firestore
      await setDoc(doc(db, "formFields", fieldId), {
        ...newField,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Add field to local state
      setFormFields(prev => [...prev, { ...newField, id: fieldId }]);
      
      // Reset form
      setNewField({
        label: "",
        type: "text",
        placeholder: "",
        required: true,
        helperText: "",
        departmentId: activeDepartment,
        order: getNextOrderNumber() // Set order to be next in sequence
      });
      
      setIsDialogOpen(false);
      toast.success("Question added successfully", { id: "admin-question-added" });
    } catch (error) {
      console.error("Error adding field:", error);
      toast.error("Unable to add question", { id: "admin-question-add-error" });
    } finally {
      setSaving(false);
    }
  };
  
  // Start editing a field
  const handleEditField = (field: FormField) => {
    setEditingFieldId(field.id);
    setEditingField({ ...field });
  };
  
  // Cancel editing a field
  const handleCancelEdit = () => {
    setEditingFieldId(null);
    setEditingField(null);
  };
  
  // Save edited field
  const handleSaveEdit = async () => {
    if (!editingField || !editingFieldId) return;
    
    if (!editingField.label.trim()) {
      toast.error("Question label is required", { id: "admin-question-edit-label-required" });
      return;
    }
    
    setSaving(true);
    try {
      // Update field in Firestore
      await updateDoc(doc(db, "formFields", editingFieldId), {
        ...editingField,
        updatedAt: serverTimestamp()
      });
      
      // Update field in local state
      setFormFields(prev => 
        prev.map(field => 
          field.id === editingFieldId ? editingField : field
        )
      );
      
      setEditingFieldId(null);
      setEditingField(null);
      toast.success("Question updated successfully", { id: "admin-question-updated" });
    } catch (error) {
      console.error("Error updating field:", error);
      toast.error("Unable to update question", { id: "admin-question-update-error" });
    } finally {
      setSaving(false);
    }
  };
  
  // Delete a field
  const handleDeleteField = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    
    setSaving(true);
    try {
      // Delete field from Firestore
      await deleteDoc(doc(db, "formFields", fieldId));
      
      // Remove field from local state
      setFormFields(prev => prev.filter(field => field.id !== fieldId));
      
      toast.success("Question deleted successfully", { id: "admin-question-deleted" });
    } catch (error) {
      console.error("Error deleting field:", error);
      toast.error("Unable to delete question", { id: "admin-question-delete-error" });
    } finally {
      setSaving(false);
    }
  };
  
  // Migration function to add order field to existing questions
  const handleMigrateOrders = async () => {
    if (!confirm("This will assign default order numbers to all questions that don't have them. Continue?")) return;
    
    setSaving(true);
    try {
      const fieldsToUpdate = formFields.filter(f => f.order === undefined);
      if (fieldsToUpdate.length === 0) {
        toast.info("All questions already have order numbers", { id: "migration-not-needed" });
        return;
      }
      
      const batch = writeBatch(db);
      fieldsToUpdate.forEach((field, index) => {
        const fieldRef = doc(db, "formFields", field.id);
        batch.update(fieldRef, { 
          order: index + 1,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      
      // Update local state
      setFormFields(prev => prev.map((field, index) => 
        field.order === undefined ? { ...field, order: index + 1 } : field
      ));
      
      toast.success(`Assigned order numbers to ${fieldsToUpdate.length} questions`, { id: "migration-success" });
    } catch (error) {
      console.error("Error migrating orders:", error);
      toast.error("Failed to migrate question orders", { id: "migration-error" });
    } finally {
      setSaving(false);
    }
  };
  
  // Get department name from ID
  const getDepartmentName = (id: string) => {
    return DEPARTMENTS[id as keyof typeof DEPARTMENTS] || id;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {!isCoreTeam && department 
              ? `${getAdminDeptName(department)} Questions` 
              : "Form Questions"}
          </h1>
          <p className="text-muted-foreground">
            {!isCoreTeam && department 
              ? `Manage application questions for the ${getAdminDeptName(department)} department` 
              : "Manage application form questions for all departments"}
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Form Questions</CardTitle>
            <CardDescription>
              Customize the questions for department application forms
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            {/* Show migration button if there are fields without order */}
            {formFields.some(f => f.order === undefined) && (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleMigrateOrders}
                disabled={saving}
              >
                <FileText className="mr-2 h-4 w-4" /> Fix Order
              </Button>
            )}
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Question
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Question</DialogTitle>
                <DialogDescription>
                  Create a new question for the {getDepartmentName(activeDepartment)} application form
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="question-label">Question Label</Label>
                  <Input
                    id="question-label"
                    placeholder="Enter question label"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="question-type">Question Type</Label>
                  <Select
                    value={newField.type}
                    onValueChange={(value) => setNewField({ ...newField, type: value as FormField['type'] })}
                  >
                    <SelectTrigger id="question-type">
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Short Text</SelectItem>
                      <SelectItem value="textarea">Long Text</SelectItem>
                      <SelectItem value="url">URL / Link</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="question-placeholder">Placeholder Text (Optional)</Label>
                  <Input
                    id="question-placeholder"
                    placeholder="Enter placeholder text"
                    value={newField.placeholder || ""}
                    onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="question-helper">Helper Text (Optional)</Label>
                  <Input
                    id="question-helper"
                    placeholder="Enter helper text"
                    value={newField.helperText || ""}
                    onChange={(e) => setNewField({ ...newField, helperText: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="question-order">Question Order</Label>
                  <Input
                    id="question-order"
                    type="number"
                    min="1"
                    placeholder="Enter question order (1, 2, 3...)"
                    value={newField.order}
                    onChange={(e) => setNewField({ ...newField, order: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Questions will appear in this order. Lower numbers appear first.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="question-required"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="question-required">Required question</Label>
                </div>
                
                {isCoreTeam && availableDepartments.length > 1 && (
                  <div className="grid gap-2">
                    <Label htmlFor="question-department">Department</Label>
                    <Select
                      value={newField.departmentId}
                      onValueChange={(value) => setNewField({ ...newField, departmentId: value })}
                    >
                      <SelectTrigger id="question-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddField} disabled={saving}>
                  {saving ? "Adding..." : "Add Question"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Department selector - only for core team */}
          {isCoreTeam && availableDepartments.length > 1 && (
            <div className="mb-6">
              <Label htmlFor="department-select">Select Department</Label>
              <Select value={activeDepartment} onValueChange={handleDepartmentChange}>
                <SelectTrigger id="department-select" className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Questions list */}
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loading size="md" text="Loading questions..." />
            </div>
          ) : formFields.length === 0 ? (
            <div className="py-12 text-center border rounded-md bg-gray-50">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No questions yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding questions to the {getDepartmentName(activeDepartment)} application form
              </p>
              <Button className="mt-6" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add First Question
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px] rounded-md border">
              <div className="p-4 space-y-4">
                {formFields.map((field) => (
                  <div 
                    key={field.id} 
                    className={`p-4 rounded-md border ${
                      editingFieldId === field.id ? "border-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    {editingFieldId === field.id ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`edit-label-${field.id}`}>Question Label</Label>
                          <Input
                            id={`edit-label-${field.id}`}
                            value={editingField?.label || ""}
                            onChange={(e) => 
                              setEditingField(prev => prev ? { ...prev, label: e.target.value } : null)
                            }
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`edit-type-${field.id}`}>Question Type</Label>
                          <Select
                            value={editingField?.type || "text"}
                            onValueChange={(value) => 
                              setEditingField(prev => prev ? { ...prev, type: value as FormField['type'] } : null)
                            }
                          >
                            <SelectTrigger id={`edit-type-${field.id}`} className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Short Text</SelectItem>
                              <SelectItem value="textarea">Long Text</SelectItem>
                              <SelectItem value="url">URL / Link</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor={`edit-placeholder-${field.id}`}>Placeholder Text</Label>
                          <Input
                            id={`edit-placeholder-${field.id}`}
                            value={editingField?.placeholder || ""}
                            onChange={(e) => 
                              setEditingField(prev => prev ? { ...prev, placeholder: e.target.value } : null)
                            }
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`edit-helper-${field.id}`}>Helper Text</Label>
                          <Input
                            id={`edit-helper-${field.id}`}
                            value={editingField?.helperText || ""}
                            onChange={(e) => 
                              setEditingField(prev => prev ? { ...prev, helperText: e.target.value } : null)
                            }
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`edit-order-${field.id}`}>Question Order</Label>
                          <Input
                            id={`edit-order-${field.id}`}
                            type="number"
                            min="1"
                            value={editingField?.order || 1}
                            onChange={(e) => 
                              setEditingField(prev => prev ? { ...prev, order: parseInt(e.target.value) || 1 } : null)
                            }
                            className="mt-1"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Questions will appear in this order. Lower numbers appear first.
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-required-${field.id}`}
                            checked={editingField?.required || false}
                            onChange={(e) => 
                              setEditingField(prev => prev ? { ...prev, required: e.target.checked } : null)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor={`edit-required-${field.id}`}>Required question</Label>
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancelEdit}
                            disabled={saving}
                          >
                            <X className="mr-1 h-4 w-4" /> Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleSaveEdit}
                            disabled={saving}
                          >
                            <Check className="mr-1 h-4 w-4" /> Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                #{field.order || 'N/A'}
                              </span>
                              <h4 className="font-medium">{field.label}</h4>
                            </div>
                            {field.required && (
                              <Badge variant="outline" className="text-red-500 border-red-200">Required</Badge>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditField(field)}
                            >
                              <PenLine className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteField(field.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-500">
                          <Badge variant="secondary" className="mr-2">
                            {field.type === "text" ? "Short Text" : 
                              field.type === "textarea" ? "Long Text" : 
                              field.type === "url" ? "URL" : "Email"}
                          </Badge>
                          {field.placeholder && (
                            <span className="mr-2">Placeholder: "{field.placeholder}"</span>
                          )}
                          {field.helperText && (
                            <span>Helper: "{field.helperText}"</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 