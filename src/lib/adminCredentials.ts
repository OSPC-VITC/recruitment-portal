"use client";

import { AdminUser, DepartmentId } from "./adminConfig";

/**
 * This file handles loading admin credentials from environment variables
 */

// Debug check to verify environment variables are available
// console.log("Environment variables check:", {
//   coreEmailExists: !!process.env.NEXT_PUBLIC_ADMIN_CORE_PRANN_EMAIL,
//   corePwdExists: !!process.env.NEXT_PUBLIC_ADMIN_CORE_PRANN_PASSWORD,
//   exampleValue: process.env.NEXT_PUBLIC_ADMIN_CORE_PRANN_EMAIL?.substring(0, 3) || 'not-found'
// });

// Core team admin users
const coreTeamAdmins: AdminUser[] = [
  {
    email: process.env.NEXT_PUBLIC_ADMIN_CORE_PRANN_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_CORE_PRANN_PASSWORD || "",
    role: "core_team",
    name: process.env.NEXT_PUBLIC_ADMIN_CORE_PRANN_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_CORE_MITHI_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_CORE_MITHI_PASSWORD || "",
    role: "core_team",
    name: process.env.NEXT_PUBLIC_ADMIN_CORE_MITHI_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_CORE_DERRI_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_CORE_DERRI_PASSWORD || "",
    role: "core_team",
    name: process.env.NEXT_PUBLIC_ADMIN_CORE_DERRI_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_CORE_PAVIT_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_CORE_PAVIT_PASSWORD || "",
    role: "core_team",
    name: process.env.NEXT_PUBLIC_ADMIN_CORE_PAVIT_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_CORE_KISHO_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_CORE_KISHO_PASSWORD || "",
    role: "core_team",
    name: process.env.NEXT_PUBLIC_ADMIN_CORE_KISHO_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_CORE_VENKA_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_CORE_VENKA_PASSWORD || "",
    role: "core_team",
    name: process.env.NEXT_PUBLIC_ADMIN_CORE_VENKA_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_CORE_SNAVE_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_CORE_SNAVE_PASSWORD || "",
    role: "core_team",
    name: process.env.NEXT_PUBLIC_ADMIN_CORE_SNAVE_NAME || ""
  },
];

// Department lead admin users
const departmentLeadAdmins: AdminUser[] = [
  // Event Operations & Management
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_VAIBH_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_VAIBH_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_VAIBH_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_VAIBH_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_LOHIT_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_LOHIT_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_LOHIT_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_LOHIT_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_MADHA_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_MADHA_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_MADHA_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_MADHA_NAME || ""
  },
  // Design & Content
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_BHAVE_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_BHAVE_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_BHAVE_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_BHAVE_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_ROHAN_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_ROHAN_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_ROHAN_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_ROHAN_NAME || ""
  },
  
  // Marketing
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_GAUTH_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_GAUTH_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_GAUTH_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_GAUTH_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_AZRAF_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_AZRAF_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_AZRAF_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_AZRAF_NAME || ""
  },
  
  // Social Media
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_BASWA_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_BASWA_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_BASWA_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_BASWA_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_KRITI_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_KRITI_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_KRITI_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_KRITI_NAME || ""
  },
  
  // Open Source & Research
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_VPRAS_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_VPRAS_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_VPRAS_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_VPRAS_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_VIJUS_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_VIJUS_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_VIJUS_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_VIJUS_NAME || ""
  },
  
  // AI & ML
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_DHILI_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_DHILI_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_DHILI_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_DHILI_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_ARAVI_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_ARAVI_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_ARAVI_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_ARAVI_NAME || ""
  },
  
  // Development
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_SHOUR_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_SHOUR_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_SHOUR_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_SHOUR_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_ROHIT_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_ROHIT_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_ROHIT_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_ROHIT_NAME || ""
  },
  
  // Game Development
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_MOHAM_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_MOHAM_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_MOHAM_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_MOHAM_NAME || ""
  },
  
  // CyberSec & Blockchain
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_PRIYA_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_PRIYA_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_PRIYA_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_PRIYA_NAME || ""
  },
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_KEERT_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_KEERT_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_KEERT_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_KEERT_NAME || ""
  },
  
  // Robotics & IoT
  {
    email: process.env.NEXT_PUBLIC_ADMIN_DEPT_SANJA_EMAIL || "",
    password: process.env.NEXT_PUBLIC_ADMIN_DEPT_SANJA_PASSWORD || "",
    role: "dept_lead",
    department: (process.env.NEXT_PUBLIC_ADMIN_DEPT_SANJA_DEPARTMENT as DepartmentId) || "",
    name: process.env.NEXT_PUBLIC_ADMIN_DEPT_SANJA_NAME || ""
  },
];

// Fallback department mapping for critical accounts (in case env vars are missing)
const departmentFallbackMapping: Record<string, DepartmentId> = {
  // Open Source department leads - use actual email patterns
  'vpras': 'open_source',
  'vijus': 'open_source',

  // Game Dev department leads
  'moham': 'game_dev',

  // Add other critical mappings as needed
};

// Apply fallback department mapping if department is missing
const applyDepartmentFallback = (admin: AdminUser): AdminUser => {
  if (admin.role === 'dept_lead' && !admin.department && admin.email) {
    // Try to match by email prefix (before @)
    const emailPrefix = admin.email.split('@')[0].toLowerCase();
    const fallbackDept = departmentFallbackMapping[emailPrefix];
    if (fallbackDept) {
      return { ...admin, department: fallbackDept };
    }
  }
  return admin;
};

// Filter out any admin users with missing email or password, and apply fallbacks
const filteredCoreTeamAdmins = coreTeamAdmins.filter(admin => admin.email && admin.password);
const filteredDepartmentLeadAdmins = departmentLeadAdmins
  .filter(admin => admin.email && admin.password)
  .map(applyDepartmentFallback);

// Combine all admin users
export const adminCredentials: AdminUser[] = [...filteredCoreTeamAdmins, ...filteredDepartmentLeadAdmins];