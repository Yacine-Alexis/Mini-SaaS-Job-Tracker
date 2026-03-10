/**
 * AI Assistant - Natural language job search assistant.
 * Provides intelligent responses and job discovery.
 * @module lib/ai/assistant
 */

import { prisma } from '@/lib/db';
import { ApplicationStage, Priority, RemoteType, JobType } from '@prisma/client';

// Common job boards and resources by industry/role
const JOB_RESOURCES: Record<string, { name: string; url: string; specialty: string }[]> = {
  tech: [
    { name: 'LinkedIn Jobs', url: 'https://linkedin.com/jobs', specialty: 'All tech roles' },
    { name: 'Indeed', url: 'https://indeed.com', specialty: 'General job board' },
    { name: 'Glassdoor', url: 'https://glassdoor.com/job-listings', specialty: 'With company reviews' },
    { name: 'AngelList/Wellfound', url: 'https://wellfound.com', specialty: 'Startups' },
    { name: 'Dice', url: 'https://dice.com', specialty: 'Tech-focused' },
    { name: 'Stack Overflow Jobs', url: 'https://stackoverflow.com/jobs', specialty: 'Developer roles' },
    { name: 'GitHub Jobs', url: 'https://jobs.github.com', specialty: 'Developer roles' },
    { name: 'Hired', url: 'https://hired.com', specialty: 'Tech talent marketplace' },
    { name: 'Triplebyte', url: 'https://triplebyte.com', specialty: 'Pre-screened engineers' },
    { name: 'HackerNews Who\'s Hiring', url: 'https://news.ycombinator.com/jobs', specialty: 'Startup jobs monthly' },
  ],
  remote: [
    { name: 'Remote.co', url: 'https://remote.co/remote-jobs', specialty: 'Remote-first companies' },
    { name: 'We Work Remotely', url: 'https://weworkremotely.com', specialty: 'Remote jobs' },
    { name: 'FlexJobs', url: 'https://flexjobs.com', specialty: 'Flexible/remote work' },
    { name: 'RemoteOK', url: 'https://remoteok.com', specialty: 'Remote tech jobs' },
    { name: 'Working Nomads', url: 'https://workingnomads.com', specialty: 'Digital nomad jobs' },
  ],
  design: [
    { name: 'Dribbble Jobs', url: 'https://dribbble.com/jobs', specialty: 'Design roles' },
    { name: 'Behance Jobs', url: 'https://behance.net/joblist', specialty: 'Creative roles' },
    { name: 'AIGA Design Jobs', url: 'https://designjobs.aiga.org', specialty: 'Design industry' },
  ],
  product: [
    { name: 'Product Hunt Jobs', url: 'https://producthunt.com/jobs', specialty: 'Product roles' },
    { name: 'Mind the Product', url: 'https://mindtheproduct.com/jobs', specialty: 'PM roles' },
  ],
  data: [
    { name: 'Kaggle Jobs', url: 'https://kaggle.com/jobs', specialty: 'Data science' },
    { name: 'DataJobs', url: 'https://datajobs.com', specialty: 'Data/analytics roles' },
  ],
};

// Intent recognition patterns
const INTENT_PATTERNS = {
  jobSearch: /(?:find|search|look for|where|apply|discover|suggest|recommend)\s*(?:jobs?|roles?|positions?|opportunities?|companies?)/i,
  statusQuestion: /(?:how|what).*(?:doing|going|progress|applications?|status)/i,
  improvementQuestion: /(?:how|what).*(?:improve|better|increase|boost|chances?|success)/i,
  salaryQuestion: /(?:salary|compensation|pay|wage|how much|earning)/i,
  interviewQuestion: /(?:interview|prepare|questions?|tips?)/i,
  companyQuestion: /(?:company|companies|employer|where to apply)/i,
  greeting: /^(?:hi|hello|hey|howdy|good morning|good afternoon)/i,
  thanks: /(?:thanks?|thank you|thx)/i,
  insights: /(?:insights?|analytics?|stats?|statistics?|trends?|patterns?)/i,
};

export interface AssistantResponse {
  message: string;
  suggestions?: string[];
  resources?: { name: string; url: string; specialty: string }[];
  data?: Record<string, unknown>;
  type: 'text' | 'insights' | 'jobs' | 'tips' | 'greeting';
}

export interface UserContext {
  totalApplications: number;
  recentApplications: Array<{
    company: string;
    title: string;
    stage: ApplicationStage;
    tags: string[];
  }>;
  stageCounts: Record<string, number>;
  topTags: string[];
  successfulPatterns: {
    companies: string[];
    titles: string[];
    tags: string[];
  };
}

/**
 * Gets user context for personalized responses.
 */
export async function getUserContext(userId: string): Promise<UserContext> {
  const [applications, stageCounts] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        company: true,
        title: true,
        stage: true,
        tags: true,
      },
    }),
    prisma.jobApplication.groupBy({
      by: ['stage'],
      where: { userId, deletedAt: null },
      _count: true,
    }),
  ]);

  // Build tag frequency
  const tagFrequency: Record<string, number> = {};
  applications.forEach(app => {
    app.tags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
  });
  
  const topTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  // Find successful patterns (offers/interviews)
  const successful = applications.filter(
    app => app.stage === 'OFFER' || app.stage === 'INTERVIEW'
  );

  const stageCountsMap: Record<string, number> = {};
  stageCounts.forEach(sc => {
    stageCountsMap[sc.stage] = sc._count;
  });

  return {
    totalApplications: applications.length,
    recentApplications: applications.slice(0, 10),
    stageCounts: stageCountsMap,
    topTags,
    successfulPatterns: {
      companies: [...new Set(successful.map(s => s.company))].slice(0, 5),
      titles: [...new Set(successful.map(s => s.title))].slice(0, 5),
      tags: [...new Set(successful.flatMap(s => s.tags))].slice(0, 5),
    },
  };
}

/**
 * Detects user intent from their query.
 */
function detectIntent(query: string): string {
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.test(query)) {
      return intent;
    }
  }
  return 'general';
}

/**
 * Determines relevant job categories based on user's application history.
 */
function detectJobCategories(context: UserContext): string[] {
  const categories: string[] = ['tech']; // Default
  const allText = [
    ...context.topTags,
    ...context.recentApplications.flatMap(a => [a.title.toLowerCase(), a.company.toLowerCase()]),
  ].join(' ').toLowerCase();

  if (/remote|wfh|work from home/i.test(allText)) categories.push('remote');
  if (/design|ux|ui|creative|figma/i.test(allText)) categories.push('design');
  if (/product|pm|product manager/i.test(allText)) categories.push('product');
  if (/data|analytics|ml|machine learning|ai/i.test(allText)) categories.push('data');

  return [...new Set(categories)];
}

/**
 * Generates personalized job search suggestions.
 */
function generateJobSuggestions(context: UserContext): { name: string; url: string; specialty: string }[] {
  const categories = detectJobCategories(context);
  const resources: { name: string; url: string; specialty: string }[] = [];

  categories.forEach(cat => {
    if (JOB_RESOURCES[cat]) {
      resources.push(...JOB_RESOURCES[cat].slice(0, 3));
    }
  });

  // Deduplicate
  const seen = new Set<string>();
  return resources.filter(r => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  }).slice(0, 8);
}

/**
 * Generates improvement tips based on user's application history.
 */
function generateImprovementTips(context: UserContext): string[] {
  const tips: string[] = [];
  const { stageCounts, totalApplications, successfulPatterns } = context;

  const applied = stageCounts['APPLIED'] || 0;
  const interviews = stageCounts['INTERVIEW'] || 0;
  const offers = stageCounts['OFFER'] || 0;
  const rejected = stageCounts['REJECTED'] || 0;

  // Calculate conversion rates
  const interviewRate = totalApplications > 0 ? (interviews + offers) / totalApplications : 0;
  const offerRate = interviews > 0 ? offers / interviews : 0;

  if (totalApplications < 10) {
    tips.push("You're just getting started! Aim for 10-15 applications per week to build momentum.");
  }

  if (interviewRate < 0.1 && totalApplications >= 10) {
    tips.push("Your interview rate is below 10%. Consider tailoring your resume for each application.");
    tips.push("Try reaching out to recruiters on LinkedIn for positions you're interested in.");
  }

  if (interviews > 0 && offerRate < 0.2) {
    tips.push("Practice behavioral questions using the STAR method to improve interview performance.");
    tips.push("Research the company thoroughly before each interview.");
  }

  if (rejected > totalApplications * 0.7 && totalApplications >= 10) {
    tips.push("High rejection rate detected. Consider targeting roles that match your experience level more closely.");
  }

  if (successfulPatterns.tags.length > 0) {
    tips.push(`Focus on roles with tags like: ${successfulPatterns.tags.slice(0, 3).join(', ')} - these match your success pattern.`);
  }

  if (successfulPatterns.companies.length > 0) {
    tips.push(`Companies similar to ${successfulPatterns.companies[0]} might be a good fit based on your history.`);
  }

  // Default tips if we don't have enough data
  if (tips.length === 0) {
    tips.push("Keep your LinkedIn profile updated and active.");
    tips.push("Network with professionals in your target industry.");
    tips.push("Follow up on applications after 1-2 weeks if you haven't heard back.");
  }

  return tips.slice(0, 5);
}

/**
 * Generates a status summary for the user.
 */
function generateStatusSummary(context: UserContext): string {
  const { stageCounts, totalApplications } = context;
  const interviews = stageCounts['INTERVIEW'] || 0;
  const offers = stageCounts['OFFER'] || 0;
  const active = totalApplications - (stageCounts['REJECTED'] || 0);

  if (totalApplications === 0) {
    return "You haven't added any applications yet. Let's get started!";
  }

  let summary = `You have ${totalApplications} total applications`;
  
  if (active > 0) {
    summary += `, ${active} still active`;
  }
  
  if (interviews > 0) {
    summary += `. ${interviews} in interview stage`;
  }
  
  if (offers > 0) {
    summary += `. Congratulations on ${offers} offer${offers > 1 ? 's' : ''}!`;
  } else {
    const interviewRate = Math.round((interviews / totalApplications) * 100);
    summary += `. Your interview rate is ${interviewRate}%.`;
  }

  return summary;
}

/**
 * Main assistant function - processes user queries and returns intelligent responses.
 */
export async function askAssistant(
  userId: string,
  query: string
): Promise<AssistantResponse> {
  const context = await getUserContext(userId);
  const intent = detectIntent(query);

  switch (intent) {
    case 'greeting':
      return {
        type: 'greeting',
        message: `Hello! I'm your job search assistant. ${generateStatusSummary(context)} How can I help you today?`,
        suggestions: [
          "Where should I apply?",
          "How can I improve my chances?",
          "Show me my progress",
        ],
      };

    case 'thanks':
      return {
        type: 'text',
        message: "You're welcome! Let me know if you need anything else. Good luck with your job search! 🍀",
      };

    case 'jobSearch':
    case 'companyQuestion':
      const resources = generateJobSuggestions(context);
      let message = "Based on your application history, here are some great places to find jobs:\n\n";
      
      if (context.successfulPatterns.tags.length > 0) {
        message += `Since you've had success with ${context.successfulPatterns.tags.slice(0, 2).join(' and ')} roles, I've prioritized relevant job boards.`;
      }

      return {
        type: 'jobs',
        message,
        resources,
        suggestions: [
          "How do I improve my applications?",
          "What's my current status?",
          "Give me interview tips",
        ],
      };

    case 'statusQuestion':
      return {
        type: 'insights',
        message: generateStatusSummary(context),
        data: {
          total: context.totalApplications,
          stageCounts: context.stageCounts,
          topTags: context.topTags.slice(0, 5),
        },
        suggestions: [
          "How can I improve?",
          "Where should I apply next?",
        ],
      };

    case 'improvementQuestion':
      const tips = generateImprovementTips(context);
      return {
        type: 'tips',
        message: "Here are personalized tips to improve your job search:",
        suggestions: tips,
      };

    case 'salaryQuestion':
      // Get salary insights from their applications
      const salaryApps = await prisma.jobApplication.findMany({
        where: {
          userId,
          deletedAt: null,
          OR: [{ salaryMin: { not: null } }, { salaryMax: { not: null } }],
        },
        select: { salaryMin: true, salaryMax: true, title: true },
        take: 50,
      });

      if (salaryApps.length === 0) {
        return {
          type: 'text',
          message: "I don't have enough salary data from your applications yet. Add salary ranges to your applications to get insights!",
          suggestions: ["Use Glassdoor or Levels.fyi for salary research."],
        };
      }

      const avgMin = Math.round(salaryApps.reduce((sum, a) => sum + (a.salaryMin || 0), 0) / salaryApps.length);
      const avgMax = Math.round(salaryApps.reduce((sum, a) => sum + (a.salaryMax || 0), 0) / salaryApps.length);

      return {
        type: 'insights',
        message: `Based on ${salaryApps.length} applications with salary data, your target range is $${avgMin.toLocaleString()} - $${avgMax.toLocaleString()}.`,
        suggestions: [
          "Check Levels.fyi for accurate tech salaries",
          "Glassdoor has company-specific salary reports",
          "Consider total compensation, not just base salary",
        ],
      };

    case 'interviewQuestion':
      return {
        type: 'tips',
        message: "Here are interview preparation tips:",
        suggestions: [
          "Research the company's recent news and products",
          "Prepare 2-3 questions to ask your interviewer",
          "Use the STAR method for behavioral questions",
          "Practice coding problems on LeetCode/HackerRank for tech roles",
          "Review the job description and prepare examples for each requirement",
          "Test your tech setup (camera, mic, internet) for video interviews",
        ],
      };

    case 'insights':
      return {
        type: 'insights',
        message: generateStatusSummary(context),
        data: {
          total: context.totalApplications,
          stageCounts: context.stageCounts,
          topTags: context.topTags.slice(0, 10),
          successPatterns: context.successfulPatterns,
        },
        suggestions: generateImprovementTips(context).slice(0, 3),
      };

    default:
      // General fallback with helpful suggestions
      return {
        type: 'text',
        message: `I'm here to help with your job search! Here's a quick summary: ${generateStatusSummary(context)}`,
        suggestions: [
          "Where should I apply?",
          "How's my progress?",
          "Give me tips to improve",
          "Help me prepare for interviews",
        ],
      };
  }
}

/**
 * Quick insights for subtle inline display.
 */
export async function getQuickInsights(userId: string): Promise<string[]> {
  const context = await getUserContext(userId);
  const insights: string[] = [];

  const { stageCounts, totalApplications, successfulPatterns } = context;

  if (totalApplications === 0) {
    return ["Start by adding your first job application!"];
  }

  const interviews = stageCounts['INTERVIEW'] || 0;
  const offers = stageCounts['OFFER'] || 0;
  const interviewRate = Math.round(((interviews + offers) / totalApplications) * 100);

  insights.push(`${interviewRate}% interview rate across ${totalApplications} applications`);

  if (successfulPatterns.tags.length > 0) {
    insights.push(`Best results with: ${successfulPatterns.tags.slice(0, 2).join(', ')}`);
  }

  if (offers > 0) {
    insights.push(`🎉 ${offers} offer${offers > 1 ? 's' : ''} received!`);
  } else if (interviews > 0) {
    insights.push(`${interviews} active interview${interviews > 1 ? 's' : ''}`);
  }

  const recentCount = context.recentApplications.filter(
    app => new Date(app.stage) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  
  if (recentCount > 0) {
    insights.push(`${recentCount} applications this week`);
  }

  return insights.slice(0, 3);
}
