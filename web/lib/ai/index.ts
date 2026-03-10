/**
 * AI Module - Local-first machine learning and NLP utilities.
 * This module provides trainable AI features that run locally without external API dependencies.
 * Can optionally integrate with OpenAI/Anthropic for enhanced capabilities.
 * @module lib/ai
 */

// NLP utilities
export {
  tokenize,
  extractKeywords,
  extractSkills,
  jaccardSimilarity,
  detectIndustry,
  extractExperienceYears,
  extractiveSummary,
  nGrams,
  wordFrequency,
  normalizeCompanyName,
  stem,
  STOP_WORDS,
  TECH_SKILLS,
} from './nlp';

// TF-IDF processing
export { TFIDFProcessor, calculateJobResumeMatch } from './tfidf';

// Classifiers
export {
  NaiveBayesClassifier,
  KNNClassifier,
  createTagSuggestionClassifier,
  createInterviewTypeClassifier,
} from './classifier';

// High-level services
export {
  suggestTags,
  analyzeResumeMatch,
  generateInterviewQuestions,
  recommendFollowUpTiming,
  estimateSalary,
  generateCoverLetter,
  generateApplicationInsights,
  trainTagClassifier,
  summarizeJobDescription,
  compareJobs,
} from './services';

// Caching
export {
  generateCacheKey,
  getFromCache,
  setInCache,
  clearCache,
  getCacheStats,
  withCache,
  withCacheAsync,
  AI_CACHE_TTLS,
} from './cache';

// Word Embeddings
export {
  WordEmbeddings,
  getWordEmbeddings,
  semanticJobMatch,
} from './embeddings';

// Job Recommendations
export {
  getJobRecommendations,
  findSimilarJobs,
  getApplicationInsights,
} from './recommendations';

// Feedback-based Training
export {
  getFeedbackData,
  trainTagClassifierFromFeedback,
  trainInterviewClassifierFromFeedback,
  persistClassifier,
  loadClassifier,
  shouldRetrain,
  getTrainingStats,
  autoRetrainAll,
} from './training';

// AI Analytics
export {
  getAIUsageStats,
  getAIFeedbackStats,
  getAIModelStats,
  getAIDashboardAnalytics,
  getUserAIAnalytics,
  exportAnalyticsCSV,
} from './analytics';

// AI Assistant
export {
  askAssistant,
  getQuickInsights,
  getUserContext,
  type AssistantResponse,
  type UserContext,
} from './assistant';

// Types
export type {
  TextProcessingOptions,
  ExtractedKeyword,
  MatchResult,
  InterviewQuestion,
  TagSuggestion,
  ApplicationInsights,
  FollowUpRecommendation,
  SalaryEstimate,
  CoverLetterOptions,
  GeneratedCoverLetter,
  TrainingExample,
  AIUsageRecord,
  AIFeature,
  AIConfig,
  SimilarityResult,
  TFIDFDocument,
  TFIDFVector,
} from './types';
