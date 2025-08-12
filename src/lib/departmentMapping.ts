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
  if (!deptId) return deptId;

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
    'AI-ML': DEPARTMENT_IDS.AI_ML,
    'AI_ML': DEPARTMENT_IDS.AI_ML,
    'openSource': DEPARTMENT_IDS.OPEN_SOURCE,
    'opensource': DEPARTMENT_IDS.OPEN_SOURCE,
    'open_source': DEPARTMENT_IDS.OPEN_SOURCE,
    'OPEN_SOURCE': DEPARTMENT_IDS.OPEN_SOURCE,
    'gameDev': DEPARTMENT_IDS.GAME_DEV,
    'gamedev': DEPARTMENT_IDS.GAME_DEV,
    'game_dev': DEPARTMENT_IDS.GAME_DEV,
    'GAME_DEV': DEPARTMENT_IDS.GAME_DEV,
    'socialMedia': DEPARTMENT_IDS.SOCIAL_MEDIA,
    'social_media': DEPARTMENT_IDS.SOCIAL_MEDIA,
    'SOCIAL_MEDIA': DEPARTMENT_IDS.SOCIAL_MEDIA,
    'cybersec_blockchain': DEPARTMENT_IDS.CYBERSEC,
    'CYBERSEC': DEPARTMENT_IDS.CYBERSEC,
    'blockchain': DEPARTMENT_IDS.CYBERSEC,
    'robotics_iot': DEPARTMENT_IDS.ROBOTICS,
    'ROBOTICS': DEPARTMENT_IDS.ROBOTICS,
    'iot': DEPARTMENT_IDS.ROBOTICS,
    'event_ops': DEPARTMENT_IDS.EVENTS,
    'eventOps': DEPARTMENT_IDS.EVENTS,
    'EVENTS': DEPARTMENT_IDS.EVENTS,
    'design_content': DEPARTMENT_IDS.DESIGN,
    'designContent': DEPARTMENT_IDS.DESIGN,
    'DESIGN': DEPARTMENT_IDS.DESIGN,
    'content': DEPARTMENT_IDS.DESIGN,
    'development': DEPARTMENT_IDS.DEV,
    'DEVELOPMENT': DEPARTMENT_IDS.DEV,
    'DEV': DEPARTMENT_IDS.DEV,
    'MARKETING': DEPARTMENT_IDS.MARKETING,

    // Additional legacy formats that might exist
    'tech': DEPARTMENT_IDS.DEV,
    'technical': DEPARTMENT_IDS.DEV,
    'programming': DEPARTMENT_IDS.DEV,
    'coding': DEPARTMENT_IDS.DEV,
    'ui': DEPARTMENT_IDS.DESIGN,
    'ux': DEPARTMENT_IDS.DESIGN,
    'graphics': DEPARTMENT_IDS.DESIGN,
    'creative': DEPARTMENT_IDS.DESIGN,
    'promotion': DEPARTMENT_IDS.MARKETING,
    'outreach': DEPARTMENT_IDS.MARKETING,
    'research': DEPARTMENT_IDS.OPEN_SOURCE,
    'ml': DEPARTMENT_IDS.AI_ML,
    'ai': DEPARTMENT_IDS.AI_ML,
    'machine-learning': DEPARTMENT_IDS.AI_ML,
    'artificial-intelligence': DEPARTMENT_IDS.AI_ML,
    'gaming': DEPARTMENT_IDS.GAME_DEV,
    'games': DEPARTMENT_IDS.GAME_DEV,
    'security': DEPARTMENT_IDS.CYBERSEC,
    'cyber': DEPARTMENT_IDS.CYBERSEC,
    'robot': DEPARTMENT_IDS.ROBOTICS,
    'hardware': DEPARTMENT_IDS.ROBOTICS,
    'event': DEPARTMENT_IDS.EVENTS,
    'management': DEPARTMENT_IDS.EVENTS,
    'social': DEPARTMENT_IDS.SOCIAL_MEDIA,
    'media': DEPARTMENT_IDS.SOCIAL_MEDIA,
    'sm': DEPARTMENT_IDS.SOCIAL_MEDIA
  };

  // Try exact match first
  if (normalizedMap[deptId]) {
    return normalizedMap[deptId];
  }

  // Try case-insensitive match
  const lowerDeptId = deptId.toLowerCase();
  if (normalizedMap[lowerDeptId]) {
    return normalizedMap[lowerDeptId];
  }

  // Try with spaces replaced by hyphens
  const hyphenatedId = deptId.replace(/\s+/g, '-').toLowerCase();
  if (normalizedMap[hyphenatedId]) {
    return normalizedMap[hyphenatedId];
  }

  // Try with underscores replaced by hyphens
  const underscoreToHyphen = deptId.replace(/_/g, '-').toLowerCase();
  if (normalizedMap[underscoreToHyphen]) {
    return normalizedMap[underscoreToHyphen];
  }

  // Return original if no mapping found
  return deptId;
}

// Get all valid department IDs
export function getAllDepartmentIds(): string[] {
  return Object.values(DEPARTMENT_IDS);
}

// Check if a department ID is valid
export function isValidDepartmentId(deptId: string): boolean {
  return getAllDepartmentIds().includes(normalizeDepartmentId(deptId));
}
