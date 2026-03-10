/**
 * Job Recommendations Engine
 * Recommends similar jobs based on successful applications and user patterns.
 * @module lib/ai/recommendations
 */

import { prisma } from '@/lib/db';
import { getWordEmbeddings } from './embeddings';
import { tokenize, TECH_SKILLS } from './nlp';
import { ApplicationStage } from '@prisma/client';

// Positive outcome stages (used for learning what works)
const SUCCESS_STAGES: ApplicationStage[] = [
  ApplicationStage.INTERVIEW,
  ApplicationStage.OFFER,
];

interface JobFeatures {
  id: string;
  company: string;
  title: string;
  tags: string[];
  description: string;
  stage: ApplicationStage;
  embedding: number[];
  skills: string[];
}

interface JobRecommendation {
  applicationId: string;
  company: string;
  title: string;
  similarityScore: number;
  matchReasons: string[];
  relatedSuccessfulApp?: {
    id: string;
    company: string;
    title: string;
  };
}

// Type for application data from Prisma query (matches JobApplication schema)
type ApplicationData = {
  id: string;
  company: string;
  title: string;
  tags: string[];
  description: string | null;
  stage: ApplicationStage;
  createdAt?: Date;
};

// Type for application with extracted features
type AppWithFeatures = JobFeatures & { original: ApplicationData };

/**
 * Extracts features from a job application for recommendation.
 */
function extractJobFeatures(app: {
  id: string;
  company: string;
  title: string;
  tags: string[];
  description: string | null;
  stage: ApplicationStage;
}): JobFeatures {
  const embeddings = getWordEmbeddings();
  const fullText = `${app.company} ${app.title} ${app.tags.join(' ')} ${app.description || ''}`;
  
  // Extract skills from text
  const tokens = tokenize(fullText, { removeStopWords: true, lowercase: true });
  const skills = tokens.filter(t => TECH_SKILLS.has(t));
  
  return {
    id: app.id,
    company: app.company,
    title: app.title,
    tags: app.tags,
    description: fullText,
    stage: app.stage,
    embedding: embeddings.getSentenceVector(fullText),
    skills: [...new Set(skills)],
  };
}

/**
 * Calculates similarity between two job applications.
 */
function calculateJobSimilarity(job1: JobFeatures, job2: JobFeatures): number {
  const embeddings = getWordEmbeddings();
  
  // Embedding similarity (semantic)
  const embeddingSimilarity = embeddings.cosineSimilarity(job1.embedding, job2.embedding);
  
  // Tag overlap (Jaccard)
  const tags1 = new Set(job1.tags.map(t => t.toLowerCase()));
  const tags2 = new Set(job2.tags.map(t => t.toLowerCase()));
  const tagIntersection = new Set([...tags1].filter(t => tags2.has(t)));
  const tagUnion = new Set([...tags1, ...tags2]);
  const tagSimilarity = tagUnion.size > 0 ? tagIntersection.size / tagUnion.size : 0;
  
  // Skill overlap
  const skills1 = new Set(job1.skills);
  const skills2 = new Set(job2.skills);
  const skillIntersection = new Set([...skills1].filter(s => skills2.has(s)));
  const skillUnion = new Set([...skills1, ...skills2]);
  const skillSimilarity = skillUnion.size > 0 ? skillIntersection.size / skillUnion.size : 0;
  
  // Title similarity
  const titleSimilarity = embeddings.textSimilarity(job1.title, job2.title);
  
  // Weighted combination
  return (
    embeddingSimilarity * 0.35 +
    tagSimilarity * 0.25 +
    skillSimilarity * 0.25 +
    titleSimilarity * 0.15
  );
}

/**
 * Gets job recommendations for a user based on their successful applications.
 */
export async function getJobRecommendations(
  userId: string,
  limit: number = 10
): Promise<{
  recommendations: JobRecommendation[];
  userProfile: {
    topSkills: string[];
    preferredTags: string[];
    successfulCompanyTypes: string[];
  };
}> {
  // Fetch user's applications
  const applications = await prisma.jobApplication.findMany({
    where: { userId, deletedAt: null },
    select: {
      id: true,
      company: true,
      title: true,
      tags: true,
      description: true,
      stage: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // Limit for performance
  });

  if (applications.length < 3) {
    return {
      recommendations: [],
      userProfile: {
        topSkills: [],
        preferredTags: [],
        successfulCompanyTypes: [],
      },
    };
  }

  // Separate successful and other applications
  const successfulApps = applications.filter((app) => SUCCESS_STAGES.includes(app.stage));
  const otherApps = applications.filter((app) => !SUCCESS_STAGES.includes(app.stage));

  // Build user profile from successful applications
  const userProfile = buildUserProfile(successfulApps.length > 0 ? successfulApps : applications.slice(0, 10));

  // Extract features for all applications
  const appFeatures: AppWithFeatures[] = applications.map((app) => ({
    ...extractJobFeatures(app),
    original: app,
  }));

  // If no successful applications, recommend based on most recent patterns
  const baseApps = successfulApps.length > 0 
    ? appFeatures.filter((a) => SUCCESS_STAGES.includes(a.stage))
    : appFeatures.slice(0, 5);

  // Find recommendations among non-successful applications or suggest improvements
  const recommendations: JobRecommendation[] = [];
  const seenIds = new Set<string>();

  // For each non-successful application, find similarity to successful ones
  for (const app of otherApps) {
    const features = appFeatures.find((f) => f.id === app.id)!;
    
    for (const baseApp of baseApps) {
      if (baseApp.id === app.id) continue;
      
      const similarity = calculateJobSimilarity(features, baseApp);
      
      if (similarity > 0.5 && !seenIds.has(app.id)) {
        seenIds.add(app.id);
        
        // Generate match reasons
        const matchReasons: string[] = [];
        
        // Check common tags
        const commonTags = features.tags.filter((t) => 
          baseApp.tags.map((bt) => bt.toLowerCase()).includes(t.toLowerCase())
        );
        if (commonTags.length > 0) {
          matchReasons.push(`Similar tags: ${commonTags.slice(0, 3).join(', ')}`);
        }
        
        // Check common skills
        const commonSkills = features.skills.filter((s) => baseApp.skills.includes(s));
        if (commonSkills.length > 0) {
          matchReasons.push(`Matching skills: ${commonSkills.slice(0, 3).join(', ')}`);
        }
        
        // Title similarity
        if (features.title.toLowerCase().includes(baseApp.title.split(' ')[0].toLowerCase())) {
          matchReasons.push(`Similar role type`);
        }
        
        recommendations.push({
          applicationId: app.id,
          company: app.company,
          title: app.title,
          similarityScore: Math.round(similarity * 100) / 100,
          matchReasons,
          relatedSuccessfulApp: SUCCESS_STAGES.includes(baseApp.stage) ? {
            id: baseApp.id,
            company: baseApp.company,
            title: baseApp.title,
          } : undefined,
        });
        
        break; // Only add each application once
      }
    }
  }

  // Sort by similarity score
  recommendations.sort((a, b) => b.similarityScore - a.similarityScore);

  return {
    recommendations: recommendations.slice(0, limit),
    userProfile,
  };
}

/**
 * Builds a user profile from their successful applications.
 */
function buildUserProfile(apps: Array<{
  company: string;
  title: string;
  tags: string[];
  description: string | null;
}>): {
  topSkills: string[];
  preferredTags: string[];
  successfulCompanyTypes: string[];
} {
  const skillCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const companyTypes = new Set<string>();

  for (const app of apps) {
    // Count tags
    for (const tag of app.tags) {
      const normalizedTag = tag.toLowerCase();
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
    }

    // Extract and count skills
    const text = `${app.title} ${app.description || ''}`;
    const tokens = tokenize(text, { removeStopWords: true, lowercase: true });
    
    for (const token of tokens) {
      if (TECH_SKILLS.has(token)) {
        skillCounts.set(token, (skillCounts.get(token) || 0) + 1);
      }
    }

    // Categorize company type (simplified)
    const companyLower = app.company.toLowerCase();
    if (companyLower.includes('startup') || companyLower.includes('inc')) {
      companyTypes.add('Startup');
    } else if (companyLower.includes('corp') || companyLower.includes('enterprise')) {
      companyTypes.add('Enterprise');
    }
  }

  // Sort by count and take top items
  const topSkills = [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill]) => skill);

  const preferredTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  return {
    topSkills,
    preferredTags,
    successfulCompanyTypes: [...companyTypes],
  };
}

/**
 * Finds similar jobs to a given application.
 */
export async function findSimilarJobs(
  userId: string,
  applicationId: string,
  limit: number = 5
): Promise<Array<{
  id: string;
  company: string;
  title: string;
  similarity: number;
  stage: ApplicationStage;
}>> {
  // Fetch target application
  const targetApp = await prisma.jobApplication.findFirst({
    where: { id: applicationId, userId, deletedAt: null },
    select: {
      id: true,
      company: true,
      title: true,
      tags: true,
      description: true,
      stage: true,
    },
  });

  if (!targetApp) {
    return [];
  }

  // Fetch other applications
  const otherApps = await prisma.jobApplication.findMany({
    where: {
      userId,
      deletedAt: null,
      id: { not: applicationId },
    },
    select: {
      id: true,
      company: true,
      title: true,
      tags: true,
      description: true,
      stage: true,
    },
    take: 50,
  });

  if (otherApps.length === 0) {
    return [];
  }

  const targetFeatures = extractJobFeatures(targetApp);
  
  // Calculate similarities
  const similarities = otherApps.map((app) => {
    const features = extractJobFeatures(app);
    const similarity = calculateJobSimilarity(targetFeatures, features);
    
    return {
      id: app.id,
      company: app.company,
      title: app.title,
      similarity: Math.round(similarity * 100) / 100,
      stage: app.stage,
    };
  });

  // Sort by similarity and return top N
  similarities.sort((a, b) => b.similarity - a.similarity);
  return similarities.slice(0, limit);
}

/**
 * Generates insights about user's application patterns.
 */
export async function getApplicationInsights(userId: string): Promise<{
  strongestSkills: string[];
  improvementAreas: string[];
  successPatterns: string[];
  recommendedActions: string[];
}> {
  const applications = await prisma.jobApplication.findMany({
    where: { userId, deletedAt: null },
    select: {
      id: true,
      company: true,
      title: true,
      tags: true,
      description: true,
      stage: true,
    },
  });

  if (applications.length < 5) {
    return {
      strongestSkills: [],
      improvementAreas: [],
      successPatterns: [],
      recommendedActions: ['Add more job applications to get personalized insights'],
    };
  }

  const successful = applications.filter((a) => SUCCESS_STAGES.includes(a.stage));
  const rejected = applications.filter((a) => a.stage === ApplicationStage.REJECTED);
  const pending = applications.filter((a) => 
    a.stage === ApplicationStage.SAVED || a.stage === ApplicationStage.APPLIED
  );

  // Analyze skill patterns
  const successSkills = new Set<string>();
  const rejectSkills = new Set<string>();

  for (const app of successful) {
    const text = `${app.title} ${app.description || ''}`;
    const tokens = tokenize(text, { removeStopWords: true, lowercase: true });
    tokens.filter(t => TECH_SKILLS.has(t)).forEach(s => successSkills.add(s));
  }

  for (const app of rejected) {
    const text = `${app.title} ${app.description || ''}`;
    const tokens = tokenize(text, { removeStopWords: true, lowercase: true });
    tokens.filter(t => TECH_SKILLS.has(t)).forEach(s => rejectSkills.add(s));
  }

  const strongestSkills = [...successSkills].filter(s => !rejectSkills.has(s)).slice(0, 5);
  const improvementAreas = [...rejectSkills].filter(s => !successSkills.has(s)).slice(0, 5);

  // Success patterns
  const successPatterns: string[] = [];
  const successRate = applications.length > 0 
    ? Math.round((successful.length / applications.length) * 100) 
    : 0;
  
  if (successful.length > 0) {
    successPatterns.push(`${successRate}% success rate (${successful.length}/${applications.length})`);
    
    // Tag analysis
    const successTags = successful.flatMap((a) => a.tags.map((t) => t.toLowerCase()));
    const tagCounts = new Map<string, number>();
    for (const tag of successTags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
    const topTag = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topTag) {
      successPatterns.push(`Most successful tag: "${topTag[0]}" (${topTag[1]} roles)`);
    }
  }

  // Recommended actions
  const recommendedActions: string[] = [];
  
  if (pending.length > 5) {
    recommendedActions.push(`Follow up on ${pending.length} pending applications`);
  }
  
  if (rejected.length > successful.length && rejected.length > 3) {
    recommendedActions.push('Consider focusing on roles matching your strongest skills');
  }
  
  if (strongestSkills.length > 0) {
    recommendedActions.push(`Highlight "${strongestSkills[0]}" in applications - it correlates with your successes`);
  }

  return {
    strongestSkills,
    improvementAreas,
    successPatterns,
    recommendedActions,
  };
}
