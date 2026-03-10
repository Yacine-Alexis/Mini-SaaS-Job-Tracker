/**
 * AI Training Service - Handles feedback-based classifier retraining.
 * Periodically retrains classifiers using user feedback data.
 * @module lib/ai/training
 */

import { prisma } from '@/lib/db';
import { NaiveBayesClassifier } from './classifier';
import { AIFeatureType } from '@prisma/client';

// In-memory classifier store with timestamps
interface ClassifierState {
  classifier: NaiveBayesClassifier;
  lastTrained: Date;
  feedbackCount: number;
  accuracy?: number;
}

const classifiers = new Map<string, ClassifierState>();

// Training configuration
const TRAINING_CONFIG = {
  MIN_FEEDBACK_FOR_TRAINING: 10, // Minimum feedback entries needed
  RETRAIN_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
  MIN_ACCEPTED_RATIO: 0.3, // Minimum ratio of accepted feedback to train
};

/**
 * Retrieves feedback data for a specific feature type.
 */
export async function getFeedbackData(
  featureType: AIFeatureType,
  limit: number = 1000
): Promise<Array<{
  inputText: string | null;
  suggestion: string;
  accepted: boolean;
  rating: number | null;
  correctedTo: string | null;
}>> {
  return prisma.aIFeedback.findMany({
    where: { featureType },
    select: {
      inputText: true,
      suggestion: true,
      accepted: true,
      rating: true,
      correctedTo: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Trains a tag suggestion classifier using user feedback.
 */
export async function trainTagClassifierFromFeedback(): Promise<{
  success: boolean;
  trainedExamples: number;
  accuracy?: number;
  message: string;
}> {
  const feedback = await getFeedbackData('TAG_SUGGESTION');
  
  if (feedback.length < TRAINING_CONFIG.MIN_FEEDBACK_FOR_TRAINING) {
    return {
      success: false,
      trainedExamples: 0,
      message: `Not enough feedback data. Need at least ${TRAINING_CONFIG.MIN_FEEDBACK_FOR_TRAINING} entries, have ${feedback.length}.`,
    };
  }

  const classifier = new NaiveBayesClassifier();
  let trainedCount = 0;
  let acceptedCount = 0;

  for (const item of feedback) {
    if (!item.inputText) continue;

    if (item.accepted) {
      // User accepted the suggestion - positive example
      classifier.train(item.inputText, item.suggestion);
      trainedCount++;
      acceptedCount++;
    } else if (item.correctedTo) {
      // User corrected - train with their correction instead
      classifier.train(item.inputText, item.correctedTo);
      trainedCount++;
    }
    // Rejected without correction - we don't train on these
  }

  if (trainedCount < TRAINING_CONFIG.MIN_FEEDBACK_FOR_TRAINING) {
    return {
      success: false,
      trainedExamples: trainedCount,
      message: 'Not enough quality feedback for training.',
    };
  }

  // Calculate accuracy estimate based on acceptance rate
  const accuracy = acceptedCount / feedback.length;

  // Store classifier state
  classifiers.set('tag_suggestion', {
    classifier,
    lastTrained: new Date(),
    feedbackCount: feedback.length,
    accuracy,
  });

  // Persist to database
  await persistClassifier('tag_suggestion', classifier, accuracy, trainedCount);

  return {
    success: true,
    trainedExamples: trainedCount,
    accuracy,
    message: `Successfully trained classifier with ${trainedCount} examples.`,
  };
}

/**
 * Trains an interview question classifier using feedback.
 */
export async function trainInterviewClassifierFromFeedback(): Promise<{
  success: boolean;
  trainedExamples: number;
  message: string;
}> {
  const feedback = await getFeedbackData('INTERVIEW_QUESTIONS');

  if (feedback.length < TRAINING_CONFIG.MIN_FEEDBACK_FOR_TRAINING) {
    return {
      success: false,
      trainedExamples: 0,
      message: `Not enough feedback. Need ${TRAINING_CONFIG.MIN_FEEDBACK_FOR_TRAINING}, have ${feedback.length}.`,
    };
  }

  const classifier = new NaiveBayesClassifier();
  let trainedCount = 0;

  for (const item of feedback) {
    if (!item.inputText) continue;
    
    // Use rating as quality signal (4-5 stars = good)
    if (item.accepted && (item.rating === null || item.rating >= 4)) {
      classifier.train(item.inputText, 'high_quality');
      trainedCount++;
    } else if (item.rating !== null && item.rating <= 2) {
      classifier.train(item.inputText, 'low_quality');
      trainedCount++;
    }
  }

  if (trainedCount < TRAINING_CONFIG.MIN_FEEDBACK_FOR_TRAINING) {
    return {
      success: false,
      trainedExamples: trainedCount,
      message: 'Not enough rated feedback for training.',
    };
  }

  classifiers.set('interview_quality', {
    classifier,
    lastTrained: new Date(),
    feedbackCount: feedback.length,
  });

  await persistClassifier('interview_quality', classifier, undefined, trainedCount);

  return {
    success: true,
    trainedExamples: trainedCount,
    message: `Trained quality classifier with ${trainedCount} examples.`,
  };
}

/**
 * Persists a trained classifier to the database.
 */
export async function persistClassifier(
  modelType: string,
  classifier: NaiveBayesClassifier,
  accuracy?: number,
  sampleCount: number = 0
): Promise<void> {
  const modelData = JSON.parse(classifier.serialize());

  await prisma.aIModelCache.upsert({
    where: {
      modelType_userId: {
        modelType,
        userId: null as unknown as string, // Global model
      },
    },
    create: {
      modelType,
      modelData,
      accuracy,
      sampleCount,
    },
    update: {
      modelData,
      accuracy,
      sampleCount,
      version: { increment: 1 },
      updatedAt: new Date(),
    },
  });
}

/**
 * Loads a classifier from the database.
 */
export async function loadClassifier(
  modelType: string
): Promise<NaiveBayesClassifier | null> {
  // Check in-memory cache first
  const cached = classifiers.get(modelType);
  if (cached) {
    return cached.classifier;
  }

  // Load from database
  const stored = await prisma.aIModelCache.findUnique({
    where: {
      modelType_userId: {
        modelType,
        userId: null as unknown as string,
      },
    },
  });

  if (!stored) return null;

  try {
    const classifier = NaiveBayesClassifier.deserialize(
      JSON.stringify(stored.modelData)
    );

    classifiers.set(modelType, {
      classifier,
      lastTrained: stored.updatedAt,
      feedbackCount: stored.sampleCount,
      accuracy: stored.accuracy ?? undefined,
    });

    return classifier;
  } catch (err) {
    console.error('Failed to deserialize classifier:', err);
    return null;
  }
}

/**
 * Checks if retraining is needed based on feedback count and time.
 */
export async function shouldRetrain(modelType: string): Promise<{
  shouldRetrain: boolean;
  reason: string;
  newFeedbackCount: number;
}> {
  const cached = classifiers.get(modelType);
  
  // Map model type to feature type
  const featureMap: Record<string, AIFeatureType> = {
    tag_suggestion: 'TAG_SUGGESTION',
    interview_quality: 'INTERVIEW_QUESTIONS',
  };

  const featureType = featureMap[modelType];
  if (!featureType) {
    return { shouldRetrain: false, reason: 'Unknown model type', newFeedbackCount: 0 };
  }

  // Count new feedback since last training
  const feedbackCount = await prisma.aIFeedback.count({
    where: {
      featureType,
      createdAt: cached ? { gt: cached.lastTrained } : undefined,
    },
  });

  if (!cached) {
    return {
      shouldRetrain: feedbackCount >= TRAINING_CONFIG.MIN_FEEDBACK_FOR_TRAINING,
      reason: 'No trained model exists',
      newFeedbackCount: feedbackCount,
    };
  }

  const timeSinceTraining = Date.now() - cached.lastTrained.getTime();
  const timeElapsed = timeSinceTraining > TRAINING_CONFIG.RETRAIN_INTERVAL_MS;
  const enoughFeedback = feedbackCount >= TRAINING_CONFIG.MIN_FEEDBACK_FOR_TRAINING;

  if (timeElapsed && enoughFeedback) {
    return {
      shouldRetrain: true,
      reason: `${feedbackCount} new feedback entries since last training`,
      newFeedbackCount: feedbackCount,
    };
  }

  return {
    shouldRetrain: false,
    reason: timeElapsed
      ? 'Not enough new feedback'
      : 'Recently trained',
    newFeedbackCount: feedbackCount,
  };
}

/**
 * Gets training statistics for all models.
 */
export async function getTrainingStats(): Promise<{
  models: Array<{
    modelType: string;
    lastTrained: Date | null;
    feedbackCount: number;
    accuracy: number | null;
    version: number;
  }>;
  totalFeedback: Record<string, number>;
}> {
  const models = await prisma.aIModelCache.findMany({
    select: {
      modelType: true,
      accuracy: true,
      sampleCount: true,
      version: true,
      updatedAt: true,
    },
  });

  const feedbackCounts = await prisma.aIFeedback.groupBy({
    by: ['featureType'],
    _count: true,
  });

  const totalFeedback: Record<string, number> = {};
  for (const fc of feedbackCounts) {
    totalFeedback[fc.featureType] = fc._count;
  }

  return {
    models: models.map((m) => ({
      modelType: m.modelType,
      lastTrained: m.updatedAt,
      feedbackCount: m.sampleCount,
      accuracy: m.accuracy,
      version: m.version,
    })),
    totalFeedback,
  };
}

/**
 * Runs automatic retraining for all models that need it.
 */
export async function autoRetrainAll(): Promise<{
  results: Array<{
    model: string;
    retrained: boolean;
    message: string;
  }>;
}> {
  const results: Array<{ model: string; retrained: boolean; message: string }> = [];

  // Check and retrain tag classifier
  const tagCheck = await shouldRetrain('tag_suggestion');
  if (tagCheck.shouldRetrain) {
    const tagResult = await trainTagClassifierFromFeedback();
    results.push({
      model: 'tag_suggestion',
      retrained: tagResult.success,
      message: tagResult.message,
    });
  } else {
    results.push({
      model: 'tag_suggestion',
      retrained: false,
      message: tagCheck.reason,
    });
  }

  // Check and retrain interview classifier
  const interviewCheck = await shouldRetrain('interview_quality');
  if (interviewCheck.shouldRetrain) {
    const interviewResult = await trainInterviewClassifierFromFeedback();
    results.push({
      model: 'interview_quality',
      retrained: interviewResult.success,
      message: interviewResult.message,
    });
  } else {
    results.push({
      model: 'interview_quality',
      retrained: false,
      message: interviewCheck.reason,
    });
  }

  return { results };
}
