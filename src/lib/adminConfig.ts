"use client";

import { adminCredentials } from "./adminCredentials";
import { DEPARTMENT_IDS } from "./departmentMapping";

// Admin user types
export type AdminRole = 'core_team' | 'dept_lead';
export type DepartmentId = 
  'event_ops' | 
  'design_content' | 
  'marketing' | 
  'social_media' | 
  'open_source' | 
  'ai_ml' | 
  'development' | 
  'game_dev' | 
  'cybersec_blockchain' | 
  'robotics_iot';

export interface AdminUser {
  email: string;
  password: string;
  role: AdminRole;
  department?: DepartmentId;
  name: string;
}

// Map department IDs to Firestore collection IDs - uses centralized mapping
export const departmentToFirestoreId: Record<DepartmentId, string> = {
  event_ops: DEPARTMENT_IDS.EVENTS,
  design_content: DEPARTMENT_IDS.DESIGN,
  marketing: DEPARTMENT_IDS.MARKETING,
  social_media: DEPARTMENT_IDS.SOCIAL_MEDIA,
  open_source: DEPARTMENT_IDS.OPEN_SOURCE,
  ai_ml: DEPARTMENT_IDS.AI_ML,
  development: DEPARTMENT_IDS.DEV,
  game_dev: DEPARTMENT_IDS.GAME_DEV,
  cybersec_blockchain: DEPARTMENT_IDS.CYBERSEC,
  robotics_iot: DEPARTMENT_IDS.ROBOTICS
};

// Admin users data - now loaded from adminCredentials
export const adminUsers: AdminUser[] = adminCredentials;

// Function to find admin user by email
export function findAdminByEmail(email: string): AdminUser | undefined {
  return adminUsers.find(admin => admin.email === email);
}

// Function to verify admin credentials
export function verifyAdminCredentials(email: string, password: string): AdminUser | null {
  const admin = findAdminByEmail(email);
  
  if (admin && admin.password === password) {
    return admin;
  }
  
  return null;
}

// Function to get department name from ID
export function getDepartmentName(departmentId: DepartmentId): string {
  const departmentNames: Record<DepartmentId, string> = {
    event_ops: 'Event Operations & Management',
    design_content: 'Design & Content',
    marketing: 'Marketing',
    social_media: 'Social Media',
    open_source: 'Open Source & Research',
    ai_ml: 'AI & ML',
    development: 'Development',
    game_dev: 'Game Development',
    cybersec_blockchain: 'CyberSec & Blockchain',
    robotics_iot: 'Robotics & IoT'
  };
  
  return departmentNames[departmentId] || departmentId;
} 