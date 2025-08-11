// Single source of truth for department mapping
// This file ensures consistency across frontend and backend

// Standard department IDs used throughout the application
export const DEPARTMENT_IDS = {
  AI_ML: 'ai-ml',
  DEV: 'dev', 
  OPEN_SOURCE: 'open-source',
  GAME_DEV: 'game-dev',
  CYBERSEC: 'cybersec',
  ROBOTICS: 'robotics',
  EVENTS: 'events',
  DESIGN: 'design',
  MARKETING: 'marketing',
  SOCIAL_MEDIA: 'social-media'
} as const;

// Type for department IDs
export type DepartmentId = typeof DEPARTMENT_IDS[keyof typeof DEPARTMENT_IDS];

// Normalize any department ID to the standard format
export function normalizeDepartmentId(deptId: string): string {
  const normalizedMap: Record<string, string> = {
    // Standard format (already correct)
    'ai-ml': DEPARTMENT_IDS.AI_ML,
    'dev': DEPARTMENT_IDS.DEV,
    'open-source': DEPARTMENT_IDS.OPEN_SOURCE,
    'game-dev': DEPARTMENT_IDS.GAME_DEV,
    'cybersec': DEPARTMENT_IDS.CYBERSEC,
    'robotics': DEPARTMENT_IDS.ROBOTICS,
    'events': DEPARTMENT_IDS.EVENTS,
    'design': DEPARTMENT_IDS.DESIGN,
    'marketing': DEPARTMENT_IDS.MARKETING,
    'social-media': DEPARTMENT_IDS.SOCIAL_MEDIA,
    
    // Legacy formats that need normalization
    'aiMl': DEPARTMENT_IDS.AI_ML,
    'openSource': DEPARTMENT_IDS.OPEN_SOURCE,
    'opensource': DEPARTMENT_IDS.OPEN_SOURCE,
    'gameDev': DEPARTMENT_IDS.GAME_DEV,
    'gamedev': DEPARTMENT_IDS.GAME_DEV,
    'socialMedia': DEPARTMENT_IDS.SOCIAL_MEDIA,
    
    // Admin config formats
    'ai_ml': DEPARTMENT_IDS.AI_ML,
    'open_source': DEPARTMENT_IDS.OPEN_SOURCE,
    'game_dev': DEPARTMENT_IDS.GAME_DEV,
    'social_media': DEPARTMENT_IDS.SOCIAL_MEDIA,
    'cybersec_blockchain': DEPARTMENT_IDS.CYBERSEC,
    'robotics_iot': DEPARTMENT_IDS.ROBOTICS,
    'event_ops': DEPARTMENT_IDS.EVENTS,
    'design_content': DEPARTMENT_IDS.DESIGN,
    'development': DEPARTMENT_IDS.DEV
  };
  
  return normalizedMap[deptId] || deptId;
}

// Get all valid department IDs
export function getAllDepartmentIds(): string[] {
  return Object.values(DEPARTMENT_IDS);
}

// Check if a department ID is valid
export function isValidDepartmentId(deptId: string): boolean {
  return getAllDepartmentIds().includes(normalizeDepartmentId(deptId));
}
