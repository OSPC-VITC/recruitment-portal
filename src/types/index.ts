export interface User {
  id: string;
  name: string;
  email: string;
  regNo: string;
  phone: string;
  departments: string[];
  status: 'pending' | 'approved' | 'rejected';
  departmentStatuses?: Record<string, DepartmentStatus>; // Added for department-specific statuses
  createdAt: any; // Using any for timestamp
  applicationSubmitted?: boolean;
  applicationSubmittedAt?: any; // Using any for timestamp
}

export interface Role {
  userId: string;
  role: 'admin' | 'user';
}

export interface Department {
  id: string;
  name: string;
  description: string;
  responsibilities: string[];
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

// Department-specific status interface
export interface DepartmentStatus {
  status: ApplicationStatus;
  feedback?: string;
  reviewedAt?: any; // Timestamp
  reviewedBy?: string; // Admin user ID
  updatedAt?: any; // Timestamp for when the status was last updated
  interviewDate?: any; // Timestamp for interview date
}

// Admin user types
export type AdminRole = 'core_team' | 'dept_lead';

export interface AdminUser {
  email: string;
  name: string;
  role: AdminRole;
  department?: string;
}

export interface TechApplication {
  whyJoin: string;
  codingExperience: string;
  githubLink: string;
}

export interface DesignApplication {
  whyJoin: string;
  portfolioLink?: string | null;
  tools: string[];
}

export interface MarketingApplication {
  whyJoin: string;
  experience: string;
  socialMediaLinks?: string[] | null;
}

export interface AiMlApplication {
  whyJoin: string;
  experience: string;
  aiExperience: string;
  projectLinks?: string[] | null;
}

export interface DevApplication {
  whyJoin: string;
  experience: string;
  codingExperience: string;
  githubLink?: string;
}

export interface OpenSourceApplication {
  whyJoin: string;
  experience: string;
  researchInterests: string;
  contributionLinks?: string[] | null;
}

export interface GameDevApplication {
  whyJoin: string;
  experience: string;
  gameDevExperience: string;
  portfolioLink?: string | null;
}

export interface CybersecApplication {
  whyJoin: string;
  experience: string;
  securityExperience: string;
  certifications?: string;
}

export interface RoboticsApplication {
  whyJoin: string;
  experience: string;
  hardwareExperience: string;
  projectDescription?: string;
}

export interface EventsApplication {
  whyJoin: string;
  experience: string;
  eventManagementExperience: string;
  eventIdeas: string;
}

export interface SocialMediaApplication {
  whyJoin: string;
  experience: string;
  contentCreationExperience: string;
  socialMediaProfiles?: string[] | null;
}

export interface Application {
  userId: string;
  tech?: TechApplication;
  design?: DesignApplication;
  marketing?: MarketingApplication;
  aiMl?: AiMlApplication;
  dev?: DevApplication;
  openSource?: OpenSourceApplication;
  gameDev?: GameDevApplication;
  cybersec?: CybersecApplication;
  robotics?: RoboticsApplication;
  events?: EventsApplication;
  socialMedia?: SocialMediaApplication;
  submittedAt: any; // Using any for timestamp
}

export interface DepartmentSelection {
  selectedDepartments: string[];
  maxSelections: number;
}

// Convert departments array to a Record/object for easier lookups
export const DEPARTMENTS: Record<string, string> = {
  'ai-ml': 'AI & ML',
  'dev': 'Dev',
  'opensource': 'Open Source & Research',
  'gamedev': 'Game Dev',
  'cybersec': 'CyberSec & Blockchain',
  'robotics': 'Robotics & IoT',
  'events': 'Event Ops & Management',
  'design': 'Design & Content',
  'marketing': 'Marketing',
  'social-media': 'Social Media'
};

// Department information with descriptions and responsibilities
export const DEPARTMENT_INFO: Department[] = [
  { 
    id: 'ai-ml', 
    name: 'AI & ML', 
    description: 'Artificial Intelligence and Machine Learning research and applications.',
    responsibilities: [
      'Develop machine learning models',
      'Work on AI-powered applications',
      'Research and implement new algorithms',
      'Collaborate with other technical teams'
    ]
  },
  { 
    id: 'dev', 
    name: 'Dev', 
    description: 'Software Development, Web Development, App Development and UI/UX.',
    responsibilities: [
      'Build and maintain web applications',
      'Develop mobile applications',
      'Implement software solutions',
      'Participate in code reviews'
    ]
  },
  { 
    id: 'opensource', 
    name: 'Open Source & Research', 
    description: 'Contributing to Open Source -Projects and Conducting Research.',
    responsibilities: [
      'Contribute to open source projects',
      'Conduct research on new technologies',
      'Write technical papers and documentation',
      'Collaborate with the academic community'
    ]
  },
  { 
    id: 'gamedev', 
    name: 'Game Dev', 
    description: 'Game Design, Development, and Graphics Programming.',
    responsibilities: [
      'Design and develop games',
      'Create game assets and mechanics',
      'Implement game logic and physics',
      'Test and optimize game performance'
    ]
  },
  { 
    id: 'cybersec', 
    name: 'CyberSec & Blockchain', 
    description: 'Cybersecurity, Blockchain Technology, and Secure Applications.',
    responsibilities: [
      'Analyze and improve application security',
      'Develop blockchain-based solutions',
      'Research security vulnerabilities',
      'Implement secure coding practices'
    ]
  },
  { 
    id: 'robotics', 
    name: 'Robotics & IoT', 
    description: 'Robotics, Internet of Things, and Embedded Systems.',
    responsibilities: [
      'Build and program robots',
      'Develop IoT applications',
      'Work with sensors and actuators',
      'Design embedded systems'
    ]
  },
  { 
    id: 'events', 
    name: 'Management', 
    description: 'Planning, organizing, and managing club events and workshops.',
    responsibilities: [
      'Plan and organize club events',
      'Manage logistics and operations',
      'Coordinate with other departments',
      'Ensure smooth execution of workshops'
    ]
  },
  { 
    id: 'design', 
    name: 'Design', 
    description: 'Poster Designing, Grid Post and Banner Designing, Canva & Figma, Motion poster and Graphic Designing.',
    responsibilities: [
      'Create user interfaces for applications',
      'Design graphics and visual content',
      'Develop brand materials',
      'Write and edit content for various platforms'
    ]
  },
  { 
    id: 'marketing', 
    name: 'Marketing', 
    description: 'Marketing strategies, campaigns, and outreach programs.',
    responsibilities: [
      'Develop marketing strategies',
      'Create promotional campaigns',
      'Analyze marketing metrics',
      'Coordinate outreach programs'
    ]
  },
  { 
    id: 'social-media', 
    name: 'Social Media', 
    description: 'Social Media Management, Content Creation, Photography, Video Editing, Digital Marketing, and Community Engagement.',
    responsibilities: [
      'Manage club social media accounts',
      'Create engaging social media content',
      'Build and engage with online community',
      'Track and analyze social media performance',
      'Capture and edit photos for events'
    ]
  }
]; 