import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Application, TechApplication, DesignApplication, MarketingApplication } from '@/types';
import { storeApplicationProgress, getStoredApplicationProgress, clearStoredApplicationProgress } from './authStateHelpers';
import { normalizeDepartmentId } from './departmentMapping';

interface ApplicationState {
  // User data
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Department selection state
  departmentSelection: {
    selectedDepartments: string[];
    maxSelections: number;
  };
  selectDepartment: (department: string) => void;
  deselectDepartment: (department: string) => void;
  resetDepartmentSelection: () => void;
  
  // Application form data
  applicationData: {
    'ai-ml'?: any;
    'dev'?: any;
    'open-source'?: any;
    'game-dev'?: any;
    'cybersec'?: any;
    'robotics'?: any;
    'events'?: any;
    'design'?: any;
    'marketing'?: any;
    'social-media'?: any;
    userId?: string;
    submittedAt?: any;
  };
  
  // Update application form data methods
  updateFormData: (department: string, data: any) => void;
  getFormData: (department: string) => any;
  clearFormData: (department: string) => void;
  resetApplicationData: () => void;
  setAllFormsData: (data: any) => void;
  
  // Session persistence methods
  saveProgress: (userId: string) => void;
  restoreProgress: (userId: string) => boolean;
  clearProgress: (userId: string) => void;
}

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set, get) => ({
      // User data
      user: null,
      setUser: (user) => set({ user }),
      
      // Department selection state
      departmentSelection: {
        selectedDepartments: [],
        maxSelections: 2, // Allow max 2 departments to be selected
      },
      
      // Actions for department selection
      selectDepartment: (department: string) => 
        set((state) => {
          // Store: selecting department
          
          // Only add if not already selected and under max limit
          if (
            !state.departmentSelection.selectedDepartments.includes(department) &&
            state.departmentSelection.selectedDepartments.length < state.departmentSelection.maxSelections
          ) {
            // Adding department to selections
            const newState = {
              departmentSelection: {
                ...state.departmentSelection,
                selectedDepartments: [...state.departmentSelection.selectedDepartments, department],
              },
            };
            
            // Auto-save progress if user is set
            if (state.user?.id) {
              setTimeout(() => {
                get().saveProgress(state.user!.id);
              }, 0);
            }
            
            return newState;
          }
          
          // Department not added - already selected or max selections reached
          
          return state;
        }),
      
      deselectDepartment: (department: string) =>
        set((state) => {
          // Store: deselecting department
          
          const newSelections = state.departmentSelection.selectedDepartments.filter(
            (d) => d !== department
          );
          
          // Updated department selections
          const newState = {
            departmentSelection: {
              ...state.departmentSelection,
              selectedDepartments: newSelections,
            },
          };
          
          // Auto-save progress if user is set
          if (state.user?.id) {
            setTimeout(() => {
              get().saveProgress(state.user!.id);
            }, 0);
          }
          
          return newState;
        }),
      
      resetDepartmentSelection: () =>
        set({
          departmentSelection: {
            selectedDepartments: [],
            maxSelections: 2,
          },
        }),
      
      // Application form data
      applicationData: {},
      
      // Method to update form data for any department
      updateFormData: (department: string, data: any) =>
        set((state) => {
          // Normalize department ID to standard format
          const deptKey = normalizeDepartmentId(department);

          // Updating form data
          const newState = {
            applicationData: {
              ...state.applicationData,
              [deptKey]: {
                ...state.applicationData[deptKey as keyof typeof state.applicationData],
                ...data,
              },
            },
          };

          // Auto-save progress if user is set
          if (state.user?.id) {
            setTimeout(() => {
              get().saveProgress(state.user!.id);
            }, 0);
          }

          return newState;
        }),
        
      // Method to get form data for a department
      getFormData: (department: string) => {
        const state = get();
        const deptKey = normalizeDepartmentId(department);
        return state.applicationData[deptKey as keyof typeof state.applicationData] || {};
      },
      
      // Method to clear form data for a specific department
      clearFormData: (department: string) =>
        set((state) => {
          const deptKey = department === 'ai-ml' ? 'aiMl' : 
                        department === 'open-source' ? 'openSource' :
                        department === 'game-dev' ? 'gameDev' :
                        department === 'social-media' ? 'socialMedia' :
                        department;
          
          const newData = { ...state.applicationData };
          delete newData[deptKey as keyof typeof state.applicationData];
          
          // Auto-save progress if user is set
          if (state.user?.id) {
            setTimeout(() => {
              get().saveProgress(state.user!.id);
            }, 0);
          }
          
          return {
            applicationData: newData,
          };
        }),
      
      // Method to reset all application data
      resetApplicationData: () => 
        set({
          applicationData: {},
        }),
        
      // Method to set all form data at once (for importing from Firebase)
      setAllFormsData: (data: any) =>
        set({
          applicationData: {
            ...data,
          },
        }),
        
      // Session persistence methods
      saveProgress: (userId: string) => {
        const state = get();
        const progressData = {
          departmentSelection: state.departmentSelection,
          applicationData: state.applicationData
        };
        
        storeApplicationProgress(userId, progressData);
      },
      
      restoreProgress: (userId: string) => {
        const progress = getStoredApplicationProgress(userId);
        if (!progress) return false;
        
        set({
          departmentSelection: progress.departmentSelection || {
            selectedDepartments: [],
            maxSelections: 2,
          },
          applicationData: progress.applicationData || {}
        });
        
        return true;
      },
      
      clearProgress: (userId: string) => {
        clearStoredApplicationProgress(userId);
      },
      
      // Legacy methods for backward compatibility
      updateTechApplication: (data: any) => 
        set((state) => ({
          applicationData: {
            ...state.applicationData,
            dev: {
              ...state.applicationData.dev,
              ...data,
            },
          },
        })),
      updateDesignApplication: (data: any) => 
        set((state) => ({
          applicationData: {
            ...state.applicationData,
            design: {
              ...state.applicationData.design,
              ...data,
            },
          },
        })),
      updateMarketingApplication: (data: any) => 
        set((state) => ({
          applicationData: {
            ...state.applicationData,
            marketing: {
              ...state.applicationData.marketing,
              ...data,
            },
          },
        })),
    }),
    {
      name: 'ospc-application-storage',
    }
  )
); 