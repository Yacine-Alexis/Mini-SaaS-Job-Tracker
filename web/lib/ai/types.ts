/**
 * Type definitions for the AI module.
 * @module lib/ai/types
 */

/**
 * Options for text processing and analysis.
 */
export interface TextProcessingOptions {
  /** Remove stop words from text */
  removeStopWords?: boolean;
  /** Convert text to lowercase */
  lowercase?: boolean;
  /** Apply stemming to words */
  stemming?: boolean;
  /** Minimum word length to include */
  minWordLength?: number;
  /** Maximum number of tokens to return */
  maxTokens?: number;
}

/**
 * A single keyword extraction result.
 */
export interface ExtractedKeyword {
  /** The keyword or phrase */
  keyword: string;
  /** Relevance score (0-1) */
  score: number;
  /** Number of occurrences in the text */
  frequency: number;
  /** Whether this is a skill/technical term */
  isSkill?: boolean;
}

/**
 * Result of job-resume matching analysis.
 */
export interface MatchResult {
  /** Overall match score (0-100) */
  score: number;
  /** Detailed breakdown of the match */
  breakdown: {
    /** Skills match percentage */
    skills: number;
    /** Experience level match */
    experience: number;
    /** Keywords overlap */
    keywords: number;
  };
  /** Skills found in both resume and job */
  matchedSkills: string[];
  /** Skills required but missing from resume */
  missingSkills: string[];
  /** Improvement suggestions */
  suggestions: string[];
}

/**
 * Generated interview question.
 */
export interface InterviewQuestion {
  /** The question text */
  question: string;
  /** Category of the question */
  category: 'behavioral' | 'technical' | 'situational' | 'role-specific' | 'company-culture';
  /** Difficulty level */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Tips for answering */
  tips?: string;
  /** Sample answer structure */
  answerHints?: string[];
}

/**
 * Smart tag suggestion result.
 */
export interface TagSuggestion {
  /** Suggested tag name */
  tag: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Source of the suggestion */
  source: 'keywords' | 'skills' | 'industry' | 'role' | 'learned';
}

/**
 * Application analytics and insights.
 */
export interface ApplicationInsights {
  /** Success rate by stage */
  stageConversionRates: Record<string, number>;
  /** Average time in each stage */
  averageTimeInStage: Record<string, number>;
  /** Best performing application characteristics */
  bestPractices: string[];
  /** Areas for improvement */
  improvements: string[];
  /** Predicted success rate for current applications */
  predictions: Array<{
    applicationId: string;
    company: string;
    successProbability: number;
    factors: string[];
  }>;
}

/**
 * Follow-up timing recommendation.
 */
export interface FollowUpRecommendation {
  /** Recommended date to follow up */
  recommendedDate: Date;
  /** Confidence in the recommendation */
  confidence: number;
  /** Reason for the recommendation */
  reason: string;
  /** Suggested message template */
  messageTemplate?: string;
}

/**
 * Salary estimation result.
 */
export interface SalaryEstimate {
  /** Estimated minimum salary */
  min: number;
  /** Estimated maximum salary */
  max: number;
  /** Median estimate */
  median: number;
  /** Confidence level (0-1) */
  confidence: number;
  /** Factors affecting the estimate */
  factors: string[];
  /** Data sources used */
  dataSources: string[];
}

/**
 * Cover letter generation options.
 */
export interface CoverLetterOptions {
  /** Writing tone */
  tone: 'professional' | 'conversational' | 'enthusiastic';
  /** Letter length preference */
  length: 'short' | 'medium' | 'long';
  /** Key points to emphasize */
  emphasisPoints?: string[];
  /** Whether to include specific achievements */
  includeAchievements?: boolean;
}

/**
 * Generated cover letter result.
 */
export interface GeneratedCoverLetter {
  /** The generated cover letter text */
  content: string;
  /** Key phrases used */
  keyPhrases: string[];
  /** Customization suggestions */
  customizationTips: string[];
  /** Tokens used (for rate limiting) */
  tokensUsed: number;
}

/**
 * Training data for the classifier.
 */
export interface TrainingExample {
  /** Input text */
  text: string;
  /** Label/category */
  label: string;
  /** User who provided the feedback */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * AI feature usage record for tracking and billing.
 */
export interface AIUsageRecord {
  /** User ID */
  userId: string;
  /** Feature used */
  feature: AIFeature;
  /** Tokens used (if applicable) */
  tokensUsed?: number;
  /** Whether this used cloud API */
  usedCloudAPI: boolean;
  /** Timestamp */
  timestamp: Date;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Available AI features.
 */
export type AIFeature =
  | 'tag_suggestion'
  | 'resume_match'
  | 'interview_questions'
  | 'cover_letter'
  | 'follow_up_timing'
  | 'salary_estimate'
  | 'application_insights'
  | 'skill_extraction';

/**
 * AI configuration options.
 */
export interface AIConfig {
  /** Whether to use local-only processing */
  localOnly: boolean;
  /** OpenAI API key (optional) */
  openAIKey?: string;
  /** Anthropic API key (optional) */
  anthropicKey?: string;
  /** Maximum tokens per request */
  maxTokensPerRequest: number;
  /** Rate limit (requests per minute) */
  rateLimitPerMinute: number;
}

/**
 * Text similarity result.
 */
export interface SimilarityResult {
  /** Cosine similarity score (0-1) */
  cosineSimilarity: number;
  /** Jaccard similarity score (0-1) */
  jaccardSimilarity: number;
  /** Common terms between documents */
  commonTerms: string[];
  /** Terms unique to the first document */
  uniqueToFirst: string[];
  /** Terms unique to the second document */
  uniqueToSecond: string[];
}

/**
 * Document for TF-IDF processing.
 */
export interface TFIDFDocument {
  /** Unique identifier */
  id: string;
  /** Document content */
  content: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * TF-IDF vector representation.
 */
export interface TFIDFVector {
  /** Document ID */
  docId: string;
  /** Term frequencies */
  terms: Map<string, number>;
  /** Vector magnitude for normalization */
  magnitude: number;
}
