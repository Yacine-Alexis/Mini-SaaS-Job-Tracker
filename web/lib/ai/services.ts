/**
 * AI Services - High-level AI features for the job tracker.
 * Provides tag suggestions, resume matching, interview prep, and more.
 * @module lib/ai/services
 */

import {
  extractKeywords,
  extractSkills,
  jaccardSimilarity,
  detectIndustry,
  extractExperienceYears,
  extractiveSummary,
  tokenize,
  TECH_SKILLS,
} from './nlp';
import { TFIDFProcessor, calculateJobResumeMatch } from './tfidf';
import {
  NaiveBayesClassifier,
  KNNClassifier,
  createTagSuggestionClassifier,
  createInterviewTypeClassifier,
} from './classifier';
import {
  TagSuggestion,
  MatchResult,
  InterviewQuestion,
  FollowUpRecommendation,
  SalaryEstimate,
  GeneratedCoverLetter,
  CoverLetterOptions,
  ApplicationInsights,
  AIConfig,
  AIFeature,
} from './types';

// Singleton classifiers (lazy initialized)
let tagClassifier: NaiveBayesClassifier | null = null;
let interviewClassifier: NaiveBayesClassifier | null = null;

/**
 * Gets or creates the tag suggestion classifier.
 */
function getTagClassifier(): NaiveBayesClassifier {
  if (!tagClassifier) {
    tagClassifier = createTagSuggestionClassifier();
  }
  return tagClassifier;
}

/**
 * Gets or creates the interview type classifier.
 */
function getInterviewClassifier(): NaiveBayesClassifier {
  if (!interviewClassifier) {
    interviewClassifier = createInterviewTypeClassifier();
  }
  return interviewClassifier;
}

/**
 * Suggests tags for a job application based on job description and title.
 * 
 * @param jobDescription - Full job description text
 * @param jobTitle - Job title
 * @param company - Company name (optional, for industry hints)
 * @returns Array of tag suggestions with confidence scores
 */
export function suggestTags(
  jobDescription: string,
  jobTitle: string,
  company?: string
): TagSuggestion[] {
  const suggestions: TagSuggestion[] = [];
  const fullText = `${jobTitle} ${jobDescription} ${company || ''}`;
  
  // 1. Use classifier for category tags
  const classifier = getTagClassifier();
  const predictions = classifier.predictTopN(fullText, 5);
  
  for (const pred of predictions) {
    if (pred.confidence > 0.1) {
      suggestions.push({
        tag: pred.label,
        confidence: pred.confidence,
        source: 'learned',
      });
    }
  }
  
  // 2. Extract skill-based tags
  const skills = extractSkills(fullText);
  for (const { skill, confidence } of skills.slice(0, 8)) {
    // Format skill for tag
    const tag = skill.charAt(0).toUpperCase() + skill.slice(1);
    if (!suggestions.some(s => s.tag.toLowerCase() === tag.toLowerCase())) {
      suggestions.push({
        tag,
        confidence,
        source: 'skills',
      });
    }
  }
  
  // 3. Detect industry
  const industry = detectIndustry(fullText);
  if (industry && !suggestions.some(s => s.tag === industry)) {
    suggestions.push({
      tag: industry,
      confidence: 0.7,
      source: 'industry',
    });
  }
  
  // 4. Extract role level from title
  const titleLower = jobTitle.toLowerCase();
  if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal')) {
    if (!suggestions.some(s => s.tag === 'Senior')) {
      suggestions.push({ tag: 'Senior', confidence: 0.9, source: 'role' });
    }
  } else if (titleLower.includes('junior') || titleLower.includes('entry') || titleLower.includes('associate')) {
    if (!suggestions.some(s => s.tag === 'Junior')) {
      suggestions.push({ tag: 'Junior', confidence: 0.9, source: 'role' });
    }
  } else if (titleLower.includes('staff') || titleLower.includes('principal') || titleLower.includes('distinguished')) {
    if (!suggestions.some(s => s.tag === 'Staff+')) {
      suggestions.push({ tag: 'Staff+', confidence: 0.9, source: 'role' });
    }
  }
  
  // 5. Check for remote work mentions
  if (/\b(remote|work from home|wfh|anywhere|distributed)\b/i.test(fullText)) {
    if (!suggestions.some(s => s.tag === 'Remote')) {
      suggestions.push({ tag: 'Remote', confidence: 0.85, source: 'keywords' });
    }
  } else if (/\b(hybrid|flexible|part[- ]?remote)\b/i.test(fullText)) {
    if (!suggestions.some(s => s.tag === 'Hybrid')) {
      suggestions.push({ tag: 'Hybrid', confidence: 0.85, source: 'keywords' });
    }
  }
  
  // Sort by confidence and dedupe
  suggestions.sort((a, b) => b.confidence - a.confidence);
  
  // Return top 10 unique suggestions
  const seen = new Set<string>();
  return suggestions.filter(s => {
    const key = s.tag.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}

/**
 * Calculates how well a resume matches a job posting.
 * 
 * @param jobDescription - Job description text
 * @param resume - Resume/CV text
 * @param jobTitle - Job title (optional, for better matching)
 * @returns Match result with score, breakdown, and recommendations
 */
export function analyzeResumeMatch(
  jobDescription: string,
  resume: string,
  jobTitle?: string
): MatchResult {
  const fullJobText = jobTitle ? `${jobTitle}\n${jobDescription}` : jobDescription;
  const result = calculateJobResumeMatch(fullJobText, resume);
  
  // Map to MatchResult format
  return {
    score: result.score,
    breakdown: {
      skills: result.breakdown.skillsMatch,
      experience: result.breakdown.experienceMatch,
      keywords: result.breakdown.keywordsMatch,
    },
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    suggestions: result.recommendations,
  };
}

/**
 * Generates interview questions based on job description and role.
 * 
 * @param jobDescription - Job description text
 * @param jobTitle - Job title
 * @param interviewType - Type of interview (technical, behavioral, etc.)
 * @param count - Number of questions to generate
 * @returns Array of interview questions
 */
export function generateInterviewQuestions(
  jobDescription: string,
  jobTitle: string,
  interviewType?: 'technical' | 'behavioral' | 'situational' | 'role-specific' | 'mixed',
  count: number = 10
): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];
  const fullText = `${jobTitle} ${jobDescription}`;
  
  // Extract key information
  const skills = extractSkills(fullText).slice(0, 10);
  const keywords = extractKeywords(fullText, 15);
  const industry = detectIndustry(fullText);
  const experienceYears = extractExperienceYears(fullText);
  
  // Determine question types to generate
  const types: Array<'behavioral' | 'technical' | 'situational' | 'role-specific' | 'company-culture'> = 
    interviewType === 'mixed' || !interviewType
      ? ['behavioral', 'technical', 'situational', 'role-specific', 'company-culture']
      : [interviewType === 'behavioral' ? 'behavioral' : 
         interviewType === 'technical' ? 'technical' : 
         interviewType === 'situational' ? 'situational' : 'role-specific'];
  
  // Question templates by type
  const templates = {
    behavioral: [
      { q: 'Tell me about a time when you had to meet a tight deadline. How did you prioritize your work?', difficulty: 'medium' as const },
      { q: 'Describe a situation where you disagreed with a team member. How did you resolve it?', difficulty: 'medium' as const },
      { q: 'Give an example of a project that failed. What did you learn from it?', difficulty: 'hard' as const },
      { q: 'Tell me about a time when you went above and beyond for a project.', difficulty: 'easy' as const },
      { q: 'Describe how you handled a situation with an unclear requirement or ambiguous task.', difficulty: 'medium' as const },
      { q: 'Tell me about a time you had to learn a new technology quickly. How did you approach it?', difficulty: 'medium' as const },
    ],
    technical: [
      { q: `Explain how you would design a system for {SKILL}. What would be your main considerations?`, difficulty: 'hard' as const },
      { q: `What are the key differences between {SKILL1} and {SKILL2}? When would you choose one over the other?`, difficulty: 'medium' as const },
      { q: `Walk me through how you would debug a performance issue in a {SKILL} application.`, difficulty: 'hard' as const },
      { q: `Describe your experience with {SKILL}. What projects have you used it in?`, difficulty: 'easy' as const },
      { q: `How do you ensure code quality when working with {SKILL}?`, difficulty: 'medium' as const },
      { q: `What best practices do you follow when building applications with {SKILL}?`, difficulty: 'medium' as const },
    ],
    situational: [
      { q: 'If you discovered a critical bug right before a release, what would you do?', difficulty: 'hard' as const },
      { q: 'How would you handle a situation where stakeholders have conflicting requirements?', difficulty: 'medium' as const },
      { q: 'What would you do if you were assigned a task using a technology you\'re not familiar with?', difficulty: 'easy' as const },
      { q: 'If a colleague was struggling with their workload, how would you help while managing your own responsibilities?', difficulty: 'medium' as const },
      { q: 'How would you approach a project with an unrealistic deadline?', difficulty: 'hard' as const },
    ],
    'role-specific': [
      { q: `What attracted you to this ${jobTitle} role?`, difficulty: 'easy' as const },
      { q: `How does your experience prepare you for the ${jobTitle} position?`, difficulty: 'medium' as const },
      { q: `What do you think are the most important skills for a successful ${jobTitle}?`, difficulty: 'medium' as const },
      { q: `Where do you see the ${industry || 'industry'} heading in the next 5 years?`, difficulty: 'hard' as const },
      { q: `What would your first 90 days look like in this role?`, difficulty: 'medium' as const },
    ],
    'company-culture': [
      { q: 'What type of work environment do you thrive in?', difficulty: 'easy' as const },
      { q: 'How do you prefer to receive feedback on your work?', difficulty: 'easy' as const },
      { q: 'Describe your ideal team dynamic. What makes a team effective?', difficulty: 'medium' as const },
      { q: 'How do you balance autonomy with collaboration?', difficulty: 'medium' as const },
      { q: 'What values are most important to you in a workplace?', difficulty: 'easy' as const },
    ],
  };
  
  // Generate questions
  const skillNames = skills.map(s => s.skill);
  let questionsPerType = Math.ceil(count / types.length);
  
  for (const type of types) {
    const typeTemplates = templates[type];
    const shuffled = [...typeTemplates].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(questionsPerType, shuffled.length); i++) {
      let questionText = shuffled[i].q;
      
      // Replace placeholders with actual skills
      if (questionText.includes('{SKILL}') && skillNames.length > 0) {
        const skill = skillNames[Math.floor(Math.random() * Math.min(skillNames.length, 5))];
        questionText = questionText.replace('{SKILL}', skill);
      }
      if (questionText.includes('{SKILL1}') && skillNames.length >= 2) {
        questionText = questionText.replace('{SKILL1}', skillNames[0]);
        questionText = questionText.replace('{SKILL2}', skillNames[1]);
      }
      
      // Skip if still has placeholder
      if (questionText.includes('{SKILL')) continue;
      
      const question: InterviewQuestion = {
        question: questionText,
        category: type,
        difficulty: shuffled[i].difficulty,
        tips: getQuestionTips(type),
      };
      
      questions.push(question);
      
      if (questions.length >= count) break;
    }
    
    if (questions.length >= count) break;
  }
  
  return questions.slice(0, count);
}

/**
 * Gets tips for answering a question type.
 */
function getQuestionTips(type: string): string {
  switch (type) {
    case 'behavioral':
      return 'Use the STAR method: Situation, Task, Action, Result. Be specific with examples.';
    case 'technical':
      return 'Think out loud, ask clarifying questions, and explain your reasoning process.';
    case 'situational':
      return 'Show your problem-solving process. Consider multiple approaches before choosing one.';
    case 'role-specific':
      return 'Connect your experience directly to the job requirements. Show enthusiasm for the role.';
    case 'company-culture':
      return 'Be authentic. Research the company culture beforehand to align your answers.';
    default:
      return 'Take your time to think, and ask for clarification if needed.';
  }
}

/**
 * Recommends optimal follow-up timing based on application patterns.
 * 
 * @param appliedDate - Date the application was submitted
 * @param stage - Current application stage
 * @param hasRecruiterContact - Whether a recruiter contact exists
 * @param industry - Industry of the company (optional)
 * @returns Follow-up recommendation
 */
export function recommendFollowUpTiming(
  appliedDate: Date,
  stage: string,
  hasRecruiterContact: boolean,
  industry?: string
): FollowUpRecommendation {
  const now = new Date();
  const daysSinceApplied = Math.floor((now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Industry-specific timing (some industries move slower)
  const slowIndustries = ['Healthcare', 'Government', 'Finance', 'Enterprise'];
  const isSlow = industry && slowIndustries.some(i => i.toLowerCase() === industry.toLowerCase());
  const baseWaitDays = isSlow ? 10 : 7;
  
  let recommendedWaitDays = baseWaitDays;
  let confidence = 0.7;
  let reason = '';
  let messageTemplate = '';
  
  switch (stage.toUpperCase()) {
    case 'APPLIED':
      recommendedWaitDays = baseWaitDays;
      reason = hasRecruiterContact 
        ? 'Follow up directly with your recruiter contact after a week.'
        : 'Wait at least a week before your first follow-up.';
      confidence = 0.75;
      messageTemplate = `Hi [Name],\n\nI hope this message finds you well. I wanted to follow up on my application for the [Position] role submitted on [Date]. I'm very excited about the opportunity to join [Company] and believe my experience in [Skills] would be a great fit.\n\nI'd welcome the chance to discuss how I can contribute to your team.\n\nBest regards,\n[Your Name]`;
      break;
      
    case 'INTERVIEW':
      recommendedWaitDays = 3;
      reason = 'Send a thank-you note within 24 hours, then follow up after 3-5 days if no response.';
      confidence = 0.85;
      messageTemplate = `Hi [Interviewer Name],\n\nThank you again for taking the time to discuss the [Position] role with me. I enjoyed learning more about [specific topic discussed] and how [Company] is [something positive you learned].\n\nOur conversation reinforced my enthusiasm for the position. Please don't hesitate to reach out if you need any additional information.\n\nBest regards,\n[Your Name]`;
      break;
      
    case 'OFFER':
      recommendedWaitDays = 2;
      reason = 'Respond to offers promptly. If negotiating, take 1-2 days to prepare your response.';
      confidence = 0.9;
      break;
      
    case 'REJECTED':
      recommendedWaitDays = -1;
      reason = 'No follow-up needed for rejected applications.';
      confidence = 1;
      break;
      
    default:
      recommendedWaitDays = baseWaitDays;
      reason = 'Standard follow-up timing recommended.';
      confidence = 0.6;
  }
  
  // Calculate recommended date
  const targetDate = new Date(appliedDate);
  targetDate.setDate(targetDate.getDate() + recommendedWaitDays);
  
  // Adjust if target date is in the past
  if (targetDate < now && recommendedWaitDays > 0) {
    targetDate.setTime(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    reason += ' (Recommended date has passed, follow up soon.)';
    confidence *= 0.9;
  }
  
  // Avoid weekends for professional communication
  const dayOfWeek = targetDate.getDay();
  if (dayOfWeek === 0) targetDate.setDate(targetDate.getDate() + 1); // Monday
  if (dayOfWeek === 6) targetDate.setDate(targetDate.getDate() + 2); // Monday
  
  return {
    recommendedDate: targetDate,
    confidence,
    reason,
    messageTemplate: messageTemplate || undefined,
  };
}

/**
 * Estimates salary range based on job details and market data.
 * Note: This is a simplified estimation. Real salary data would require external APIs.
 * 
 * @param jobTitle - Job title
 * @param jobDescription - Job description
 * @param location - Location (city/country)
 * @param experienceYears - Years of experience required
 * @returns Salary estimate with confidence
 */
export function estimateSalary(
  jobTitle: string,
  jobDescription: string,
  location?: string,
  experienceYears?: number
): SalaryEstimate {
  // Base salary ranges by role type (USD, annual)
  const roleBaseSalaries: Record<string, { min: number; max: number }> = {
    'software engineer': { min: 80000, max: 200000 },
    'senior software engineer': { min: 120000, max: 250000 },
    'staff engineer': { min: 180000, max: 350000 },
    'frontend developer': { min: 70000, max: 180000 },
    'backend developer': { min: 80000, max: 200000 },
    'full stack developer': { min: 75000, max: 190000 },
    'devops engineer': { min: 90000, max: 200000 },
    'data scientist': { min: 90000, max: 220000 },
    'data engineer': { min: 85000, max: 200000 },
    'machine learning engineer': { min: 100000, max: 250000 },
    'product manager': { min: 100000, max: 220000 },
    'engineering manager': { min: 150000, max: 300000 },
    'qa engineer': { min: 60000, max: 140000 },
    'mobile developer': { min: 80000, max: 200000 },
    'security engineer': { min: 100000, max: 220000 },
    'default': { min: 60000, max: 150000 },
  };
  
  // Location multipliers
  const locationMultipliers: Record<string, number> = {
    'san francisco': 1.3,
    'sf': 1.3,
    'bay area': 1.25,
    'new york': 1.2,
    'nyc': 1.2,
    'seattle': 1.15,
    'boston': 1.1,
    'austin': 1.0,
    'denver': 0.95,
    'chicago': 1.0,
    'los angeles': 1.1,
    'remote': 0.95,
    'usa': 1.0,
    'uk': 0.85,
    'london': 0.95,
    'germany': 0.75,
    'canada': 0.8,
    'india': 0.25,
    'default': 1.0,
  };
  
  // Find matching role
  const titleLower = jobTitle.toLowerCase();
  let baseSalary = roleBaseSalaries['default'];
  let matchedRole = 'default';
  
  for (const [role, salary] of Object.entries(roleBaseSalaries)) {
    if (titleLower.includes(role) || role.split(' ').every(word => titleLower.includes(word))) {
      baseSalary = salary;
      matchedRole = role;
      break;
    }
  }
  
  // Apply location multiplier
  const locationLower = (location || '').toLowerCase();
  let locationMultiplier = 1.0;
  let matchedLocation = 'default';
  
  for (const [loc, mult] of Object.entries(locationMultipliers)) {
    if (locationLower.includes(loc)) {
      locationMultiplier = mult;
      matchedLocation = loc;
      break;
    }
  }
  
  // Experience adjustment
  const years = experienceYears || extractExperienceYears(jobDescription)?.min || 3;
  let experienceMultiplier = 1.0;
  if (years <= 2) experienceMultiplier = 0.85;
  else if (years <= 4) experienceMultiplier = 1.0;
  else if (years <= 7) experienceMultiplier = 1.15;
  else if (years <= 10) experienceMultiplier = 1.3;
  else experienceMultiplier = 1.45;
  
  // Check for high-demand skills
  const skills = extractSkills(jobDescription);
  const highDemandSkills = new Set(['kubernetes', 'machine learning', 'ai', 'golang', 'rust', 'kafka']);
  const hasHighDemand = skills.some(s => highDemandSkills.has(s.skill.toLowerCase()));
  const skillMultiplier = hasHighDemand ? 1.1 : 1.0;
  
  // Calculate range
  const minSalary = Math.round(baseSalary.min * locationMultiplier * experienceMultiplier * skillMultiplier / 1000) * 1000;
  const maxSalary = Math.round(baseSalary.max * locationMultiplier * experienceMultiplier * skillMultiplier / 1000) * 1000;
  const medianSalary = Math.round((minSalary + maxSalary) / 2 / 1000) * 1000;
  
  // Confidence based on specificity
  let confidence = 0.5;
  if (matchedRole !== 'default') confidence += 0.15;
  if (matchedLocation !== 'default') confidence += 0.15;
  if (experienceYears !== undefined) confidence += 0.1;
  confidence = Math.min(confidence, 0.85); // Never too confident without real data
  
  // Factors affecting estimate
  const factors: string[] = [];
  factors.push(`Role identified as: ${matchedRole}`);
  if (matchedLocation !== 'default') factors.push(`Location factor: ${matchedLocation}`);
  factors.push(`Experience level: ${years} years`);
  if (hasHighDemand) factors.push('High-demand skills detected');
  
  return {
    min: minSalary,
    max: maxSalary,
    median: medianSalary,
    confidence,
    factors,
    dataSources: ['Industry averages', 'Role-based estimation', 'Location adjustments'],
  };
}

/**
 * Generates a cover letter based on job description and resume.
 * Uses template-based generation with intelligent filling.
 * 
 * @param jobDescription - Job description
 * @param jobTitle - Job title
 * @param companyName - Company name
 * @param resume - User's resume text
 * @param options - Generation options
 * @returns Generated cover letter
 */
export function generateCoverLetter(
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  resume: string,
  options: CoverLetterOptions = { tone: 'professional', length: 'medium' }
): GeneratedCoverLetter {
  // Analyze both texts
  const jobSkills = extractSkills(jobDescription);
  const resumeSkills = extractSkills(resume);
  const matchedSkills = jobSkills.filter(js => 
    resumeSkills.some(rs => rs.skill.toLowerCase() === js.skill.toLowerCase())
  );
  
  const topMatchedSkills = matchedSkills.slice(0, 5).map(s => s.skill);
  const jobKeywords = extractKeywords(jobDescription, 10);
  const industry = detectIndustry(jobDescription);
  
  // Build cover letter sections
  const greeting = `Dear Hiring Manager,`;
  
  // Opening paragraph
  const openings: Record<string, string[]> = {
    professional: [
      `I am writing to express my interest in the ${jobTitle} position at ${companyName}.`,
      `I am excited to apply for the ${jobTitle} role at ${companyName}.`,
    ],
    conversational: [
      `I was thrilled to discover the ${jobTitle} opening at ${companyName}.`,
      `When I saw the ${jobTitle} position at ${companyName}, I knew I had to apply.`,
    ],
    enthusiastic: [
      `I am absolutely thrilled to apply for the ${jobTitle} position at ${companyName}!`,
      `The ${jobTitle} opportunity at ${companyName} is exactly what I've been looking for!`,
    ],
  };
  
  const opening = openings[options.tone][Math.floor(Math.random() * openings[options.tone].length)];
  
  // Skills paragraph
  let skillsParagraph = '';
  if (topMatchedSkills.length > 0) {
    const skillsList = topMatchedSkills.join(', ');
    skillsParagraph = `With proven experience in ${skillsList}, I am confident in my ability to contribute effectively to your team. `;
  }
  
  // Experience alignment
  const experienceAlignments: string[] = [
    `My background aligns well with what you're looking for in this role.`,
    `I believe my experience makes me an excellent candidate for this position.`,
    `My professional journey has prepared me well for the challenges of this role.`,
  ];
  const experienceAlign = experienceAlignments[Math.floor(Math.random() * experienceAlignments.length)];
  
  // Company-specific (generic but sounds personalized)
  const companyMentions: string[] = [
    `I am particularly drawn to ${companyName}'s commitment to innovation and excellence.`,
    `${companyName}'s reputation in the ${industry || 'industry'} makes this an exciting opportunity.`,
    `I admire ${companyName}'s approach to ${industry ? industry.toLowerCase() : 'the industry'} and would love to contribute to your mission.`,
  ];
  const companyMention = companyMentions[Math.floor(Math.random() * companyMentions.length)];
  
  // Closing
  const closings: Record<string, string> = {
    professional: `I would welcome the opportunity to discuss how my skills and experience align with your needs. Thank you for considering my application.`,
    conversational: `I'd love to chat more about how I can contribute to your team. Thank you for your time and consideration.`,
    enthusiastic: `I am eager to discuss how I can help ${companyName} achieve its goals! Thank you for this exciting opportunity.`,
  };
  
  // Length adjustments
  let middleContent = `${skillsParagraph}${experienceAlign} ${companyMention}`;
  
  if (options.length === 'short') {
    middleContent = `${skillsParagraph}${experienceAlign}`;
  } else if (options.length === 'long') {
    middleContent = `${skillsParagraph}${experienceAlign}\n\n${companyMention}`;
    if (options.emphasisPoints && options.emphasisPoints.length > 0) {
      const emphasisText = options.emphasisPoints.map(p => `• ${p}`).join('\n');
      middleContent += `\n\nKey highlights from my experience:\n${emphasisText}`;
    }
  }
  
  // Assemble letter
  const content = `${greeting}\n\n${opening} ${middleContent}\n\n${closings[options.tone]}\n\nSincerely,\n[Your Name]`;
  
  // Key phrases used
  const keyPhrases = topMatchedSkills.slice(0, 3);
  if (industry) keyPhrases.push(industry);
  
  // Customization tips
  const customizationTips: string[] = [
    'Add a specific project or achievement that relates to the role',
    'Mention why you specifically want to work at this company',
    'Include any mutual connections or referrals',
    'Quantify your achievements where possible (e.g., "increased efficiency by 30%")',
  ];
  
  return {
    content,
    keyPhrases,
    customizationTips,
    tokensUsed: content.split(/\s+/).length,
  };
}

/**
 * Generates application insights and recommendations based on user's history.
 * 
 * @param applications - User's job applications
 * @returns Application insights and predictions
 */
export function generateApplicationInsights(
  applications: Array<{
    id: string;
    company: string;
    title: string;
    stage: string;
    description?: string;
    appliedAt: Date;
    updatedAt: Date;
    tags?: string[];
  }>
): ApplicationInsights {
  if (applications.length === 0) {
    return {
      stageConversionRates: {},
      averageTimeInStage: {},
      bestPractices: ['Apply to more jobs to generate insights!'],
      improvements: [],
      predictions: [],
    };
  }
  
  // Calculate stage conversion rates
  const stageCounts: Record<string, number> = {};
  for (const app of applications) {
    const stage = app.stage.toUpperCase();
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  }
  
  const total = applications.length;
  const stageConversionRates: Record<string, number> = {};
  for (const [stage, count] of Object.entries(stageCounts)) {
    stageConversionRates[stage] = Math.round((count / total) * 100);
  }
  
  // Calculate average time in each stage
  const stageTimes: Record<string, number[]> = {};
  for (const app of applications) {
    const stage = app.stage.toUpperCase();
    const timeInStage = Math.floor(
      (new Date(app.updatedAt).getTime() - new Date(app.appliedAt).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    if (!stageTimes[stage]) stageTimes[stage] = [];
    stageTimes[stage].push(timeInStage);
  }
  
  const averageTimeInStage: Record<string, number> = {};
  for (const [stage, times] of Object.entries(stageTimes)) {
    averageTimeInStage[stage] = Math.round(
      times.reduce((a, b) => a + b, 0) / times.length
    );
  }
  
  // Generate best practices based on patterns
  const bestPractices: string[] = [];
  const improvements: string[] = [];
  
  const interviewRate = (stageCounts['INTERVIEW'] || 0) / total;
  const offerRate = (stageCounts['OFFER'] || 0) / total;
  const rejectionRate = (stageCounts['REJECTED'] || 0) / total;
  
  if (interviewRate >= 0.2) {
    bestPractices.push('Your applications are converting to interviews well (20%+ rate)');
  } else if (interviewRate < 0.1 && total >= 10) {
    improvements.push('Consider tailoring your resume more specifically to each role');
    improvements.push('Focus on roles that closely match your skills');
  }
  
  if (offerRate >= 0.1) {
    bestPractices.push('Strong offer conversion rate - your interview skills are effective');
  } else if (stageCounts['INTERVIEW'] && stageCounts['INTERVIEW'] > 3 && offerRate < 0.05) {
    improvements.push('Practice interview skills - consider mock interviews');
    improvements.push('Research companies more thoroughly before interviews');
  }
  
  if (rejectionRate < 0.3) {
    bestPractices.push('Lower than average rejection rate - good application targeting');
  } else if (rejectionRate > 0.5) {
    improvements.push('Consider applying to roles that better match your experience level');
  }
  
  // Tag analysis
  const tagFrequency: Record<string, number> = {};
  const successfulTags = new Set<string>();
  
  for (const app of applications) {
    if (app.tags) {
      for (const tag of app.tags) {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        if (app.stage === 'INTERVIEW' || app.stage === 'OFFER') {
          successfulTags.add(tag);
        }
      }
    }
  }
  
  if (successfulTags.size > 0) {
    bestPractices.push(`Roles with these tags perform well: ${Array.from(successfulTags).slice(0, 3).join(', ')}`);
  }
  
  // Generate predictions for current applications
  const currentApps = applications.filter(a => 
    !['OFFER', 'REJECTED'].includes(a.stage.toUpperCase())
  );
  
  const predictions = currentApps.slice(0, 5).map(app => {
    // Simple heuristic-based prediction
    let probability = 0.3; // Base probability
    const factors: string[] = [];
    
    // Check if tags match successful pattern
    if (app.tags && app.tags.some(t => successfulTags.has(t))) {
      probability += 0.15;
      factors.push('Matches your successful application patterns');
    }
    
    // Stage progression
    if (app.stage === 'INTERVIEW') {
      probability += 0.25;
      factors.push('Already at interview stage');
    }
    
    // Time factor (not too old)
    const daysSinceApplied = Math.floor(
      (Date.now() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceApplied < 14) {
      probability += 0.1;
      factors.push('Recently applied');
    } else if (daysSinceApplied > 30) {
      probability -= 0.1;
      factors.push('Application may be stale');
    }
    
    return {
      applicationId: app.id,
      company: app.company,
      successProbability: Math.min(Math.max(probability, 0.1), 0.9),
      factors,
    };
  });
  
  return {
    stageConversionRates,
    averageTimeInStage,
    bestPractices,
    improvements,
    predictions,
  };
}

/**
 * Trains the tag classifier with user feedback.
 * 
 * @param text - Job description or application text
 * @param tags - Correct tags assigned by user
 */
export function trainTagClassifier(text: string, tags: string[]): void {
  const classifier = getTagClassifier();
  for (const tag of tags) {
    classifier.train(text, tag);
  }
}

/**
 * Summarizes a job description.
 * 
 * @param jobDescription - Full job description
 * @returns Summarized description
 */
export function summarizeJobDescription(jobDescription: string): string {
  return extractiveSummary(jobDescription, 3);
}

/**
 * Compares two job applications for similarity.
 * 
 * @param job1 - First job description
 * @param job2 - Second job description
 * @returns Similarity score (0-100)
 */
export function compareJobs(job1: string, job2: string): number {
  const processor = new TFIDFProcessor();
  processor.addDocuments([
    { id: 'job1', content: job1 },
    { id: 'job2', content: job2 },
  ]);
  
  const similarity = processor.compareTwoTexts(job1, job2);
  return Math.round(
    (similarity.cosineSimilarity * 0.6 + similarity.jaccardSimilarity * 0.4) * 100
  );
}
