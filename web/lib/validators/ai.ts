/**
 * Zod validators for AI-related API endpoints.
 * @module lib/validators/ai
 */

import { z } from 'zod';

/**
 * Schema for tag suggestion requests.
 */
export const tagSuggestionSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  jobTitle: z.string().min(2, 'Job title is required'),
  company: z.string().optional(),
});

export type TagSuggestionInput = z.infer<typeof tagSuggestionSchema>;

/**
 * Schema for resume match analysis requests.
 */
export const resumeMatchSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  resume: z.string().min(50, 'Resume must be at least 50 characters'),
  jobTitle: z.string().optional(),
});

export type ResumeMatchInput = z.infer<typeof resumeMatchSchema>;

/**
 * Schema for interview question generation requests.
 */
export const interviewQuestionsSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  jobTitle: z.string().min(2, 'Job title is required'),
  interviewType: z.enum(['technical', 'behavioral', 'situational', 'role-specific', 'mixed']).optional(),
  count: z.number().int().min(1).max(20).optional().default(10),
});

export type InterviewQuestionsInput = z.infer<typeof interviewQuestionsSchema>;

/**
 * Schema for cover letter generation requests.
 */
export const coverLetterSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  jobTitle: z.string().min(2, 'Job title is required'),
  companyName: z.string().min(1, 'Company name is required'),
  resume: z.string().min(50, 'Resume must be at least 50 characters'),
  tone: z.enum(['professional', 'conversational', 'enthusiastic']).optional().default('professional'),
  length: z.enum(['short', 'medium', 'long']).optional().default('medium'),
  emphasisPoints: z.array(z.string()).optional(),
});

export type CoverLetterInput = z.infer<typeof coverLetterSchema>;

/**
 * Schema for salary estimation requests.
 */
export const salaryEstimateSchema = z.object({
  jobTitle: z.string().min(2, 'Job title is required'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  location: z.string().optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
});

export type SalaryEstimateInput = z.infer<typeof salaryEstimateSchema>;

/**
 * Schema for follow-up timing requests.
 */
export const followUpTimingSchema = z.object({
  appliedDate: z.string().datetime({ message: 'Invalid date format' }),
  stage: z.string().min(1, 'Stage is required'),
  hasRecruiterContact: z.boolean().optional().default(false),
  industry: z.string().optional(),
});

export type FollowUpTimingInput = z.infer<typeof followUpTimingSchema>;

/**
 * Schema for application insights requests.
 */
export const applicationInsightsSchema = z.object({
  // No input needed - will fetch from user's applications
});

export type ApplicationInsightsInput = z.infer<typeof applicationInsightsSchema>;

/**
 * Schema for skill extraction requests.
 */
export const skillExtractionSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters'),
});

export type SkillExtractionInput = z.infer<typeof skillExtractionSchema>;

/**
 * Schema for job comparison requests.
 */
export const jobComparisonSchema = z.object({
  job1: z.string().min(10, 'First job description must be at least 10 characters'),
  job2: z.string().min(10, 'Second job description must be at least 10 characters'),
});

export type JobComparisonInput = z.infer<typeof jobComparisonSchema>;

/**
 * Schema for job summarization requests.
 */
export const jobSummarySchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
});

export type JobSummaryInput = z.infer<typeof jobSummarySchema>;

/**
 * Schema for training feedback.
 */
export const trainingFeedbackSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters'),
  correctTags: z.array(z.string().min(1)).min(1, 'At least one tag is required'),
});

export type TrainingFeedbackInput = z.infer<typeof trainingFeedbackSchema>;
