import { z } from "zod";

// Registration form schema
export const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z
    .string()
    .email("Must be a valid email address")
    .refine((email) => {
      // In production, disable email domain check to allow testing
      if (process.env.NODE_ENV === 'production') return true;
      
      // In development, enforce college email
      return email.endsWith("@vitstudent.ac.in") || email.endsWith("@gmail.com") || email.endsWith("@admin.ospc.com");
    }, {
      message: "Must use your college email address (@vitstudent.ac.in) or your email (@gmail.com)"
    }),
  regNo: z
    .string()
    .refine((val) => /^\d{2}[A-Za-z]{3}\d{4}$/.test(val), {
      message: "Registration number must be in the format: 24ABC1234"
    }),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .refine((password) => /[A-Z]/.test(password), {
      message: "Password must contain at least one uppercase letter"
    })
    .refine((password) => /[a-z]/.test(password), {
      message: "Password must contain at least one lowercase letter"
    })
    .refine((password) => /[0-9]/.test(password), {
      message: "Password must contain at least one number"
    }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"]
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Login form schema
export const loginSchema = z.object({
  email: z.string().email("Must be a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Define the dynamic field value type
const dynamicFieldSchema = z.object({
  value: z.string(),
  label: z.string()
}).or(z.string()); // Allow both new format and legacy string format

// Dynamic fields only schema
const dynamicFieldsOnlySchema = z.object({
  dynamicFields: z.record(dynamicFieldSchema).optional(),
});

// For backward compatibility, keep the old schemas but make all fields optional
// Base application schema with common fields
const baseApplicationSchema = {
  whyJoin: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  experience: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  dynamicFields: z.record(dynamicFieldSchema).optional(),
};

// AI & ML application form schema
export const aiMlApplicationSchema = z.object({
  ...baseApplicationSchema,
  aiExperience: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  projectLinks: z
    .array(z.string().url("Must be a valid URL"))
    .optional()
    .nullable(),
}).merge(dynamicFieldsOnlySchema);

export type AiMlApplicationFormData = z.infer<typeof aiMlApplicationSchema>;

// Dev application form schema
export const devApplicationSchema = z.object({
  ...baseApplicationSchema,
  codingExperience: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  githubLink: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.string().length(0))
    .transform(value => value === "" ? undefined : value),
}).merge(dynamicFieldsOnlySchema);

export type DevApplicationFormData = z.infer<typeof devApplicationSchema>;

// Open Source & Research application form schema
export const openSourceApplicationSchema = z.object({
  ...baseApplicationSchema,
  researchInterests: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  contributionLinks: z
    .array(z.string().url("Must be a valid URL"))
    .optional()
    .nullable(),
}).merge(dynamicFieldsOnlySchema);

export type OpenSourceApplicationFormData = z.infer<typeof openSourceApplicationSchema>;

// Game Dev application form schema
export const gameDevApplicationSchema = z.object({
  ...baseApplicationSchema,
  gameDevExperience: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  portfolioLink: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .optional()
    .or(z.string().length(0))
    .transform(value => value === "" ? null : value),
}).merge(dynamicFieldsOnlySchema);

export type GameDevApplicationFormData = z.infer<typeof gameDevApplicationSchema>;

// CyberSec & Blockchain application form schema
export const cybersecApplicationSchema = z.object({
  ...baseApplicationSchema,
  securityExperience: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  certifications: z
    .string()
    .optional()
    .or(z.string().length(0)),
}).merge(dynamicFieldsOnlySchema);

export type CybersecApplicationFormData = z.infer<typeof cybersecApplicationSchema>;

// Robotics & IoT application form schema
export const roboticsApplicationSchema = z.object({
  ...baseApplicationSchema,
  hardwareExperience: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  projectDescription: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
}).merge(dynamicFieldsOnlySchema);

export type RoboticsApplicationFormData = z.infer<typeof roboticsApplicationSchema>;

// Events application form schema
export const eventsApplicationSchema = z.object({
  ...baseApplicationSchema,
  eventManagementExperience: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  eventIdeas: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
}).merge(dynamicFieldsOnlySchema);

export type EventsApplicationFormData = z.infer<typeof eventsApplicationSchema>;

// Design application form schema
export const designApplicationSchema = z.object({
  ...baseApplicationSchema,
  portfolioLink: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .optional()
    .or(z.string().length(0))
    .transform(value => value === "" ? null : value),
  tools: z
    .array(z.string())
    .min(1, "Select at least one tool")
    .optional(),
}).merge(dynamicFieldsOnlySchema);

export type DesignApplicationFormData = z.infer<typeof designApplicationSchema>;

// Marketing application form schema
export const marketingApplicationSchema = z.object({
  ...baseApplicationSchema,
  marketingCampaigns: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  socialMediaLinks: z
    .array(z.string().url("Must be a valid URL"))
    .nullable()
    .optional(),
}).merge(dynamicFieldsOnlySchema);

export type MarketingApplicationFormData = z.infer<typeof marketingApplicationSchema>;

// Social Media application form schema
export const socialMediaApplicationSchema = z.object({
  ...baseApplicationSchema,
  contentCreationExperience: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  socialMediaProfiles: z
    .array(z.string().url("Must be a valid URL"))
    .nullable()
    .optional(),
}).merge(dynamicFieldsOnlySchema);

export type SocialMediaApplicationFormData = z.infer<typeof socialMediaApplicationSchema>;

// Legacy schemas for backward compatibility
export const techApplicationSchema = z.object({
  whyJoin: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  codingExperience: z
    .string()
    .min(10, "Your answer must be at least 10 characters")
    .max(1000, "Your answer must be less than 1000 characters")
    .optional(),
  githubLink: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.string().length(0))
    .transform(value => value === "" ? undefined : value),
  dynamicFields: z.record(dynamicFieldSchema).optional(),
});

export type TechApplicationFormData = z.infer<typeof techApplicationSchema>; 