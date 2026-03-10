/**
 * Natural Language Processing utilities for the AI module.
 * Provides text tokenization, stop word removal, stemming, and keyword extraction.
 * @module lib/ai/nlp
 */

import { TextProcessingOptions, ExtractedKeyword } from './types';

/**
 * Common English stop words to filter out.
 */
export const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'above',
  'after', 'again', 'against', 'any', 'because', 'before', 'below',
  'between', 'during', 'into', 'through', 'under', 'until', 'up', 'down',
  'out', 'off', 'over', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'am', 'being', 'having', 'while', 'also', 'its', 'your',
  'our', 'their', 'his', 'her', 'if', 'else', 'etc', 'eg', 'ie', 'vs',
  'per', 'via', 'within', 'without', 'upon', 'across', 'along', 'around',
  'throughout', 'toward', 'towards', 'among', 'amongst', 'get', 'got',
  'make', 'made', 'take', 'took', 'come', 'came', 'go', 'went', 'see',
  'saw', 'know', 'knew', 'think', 'thought', 'well', 'work', 'working',
  'looking', 'look', 'thing', 'things', 'need', 'needs', 'want', 'wants',
  'use', 'using', 'used', 'including', 'include', 'includes', 'related',
  'able', 'ability', 'strong', 'excellent', 'good', 'great', 'best',
]);

/**
 * Common technical skills and keywords in job postings.
 * Used for enhanced keyword extraction.
 */
export const TECH_SKILLS: Set<string> = new Set([
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go',
  'golang', 'rust', 'php', 'swift', 'kotlin', 'scala', 'perl', 'r', 'matlab',
  'bash', 'shell', 'powershell', 'sql', 'nosql', 'graphql', 'html', 'css',
  'sass', 'less', 'assembly',
  
  // Frameworks & Libraries
  'react', 'reactjs', 'angular', 'vue', 'vuejs', 'svelte', 'nextjs', 'next.js',
  'nuxt', 'gatsby', 'express', 'expressjs', 'nestjs', 'fastapi', 'django',
  'flask', 'rails', 'spring', 'springboot', 'spring boot', 'laravel', '.net',
  'dotnet', 'asp.net', 'blazor', 'remix', 'node', 'nodejs', 'node.js', 'deno',
  'jquery', 'bootstrap', 'tailwind', 'tailwindcss', 'material-ui', 'mui',
  'chakra', 'antd', 'redux', 'zustand', 'mobx', 'rxjs', 'socketio', 'prisma',
  
  // Databases
  'postgresql', 'postgres', 'mysql', 'mariadb', 'mongodb', 'redis', 'sqlite',
  'oracle', 'mssql', 'sqlserver', 'dynamodb', 'cassandra', 'elasticsearch',
  'neo4j', 'couchdb', 'firebase', 'firestore', 'supabase', 'planetscale',
  
  // Cloud & DevOps
  'aws', 'amazon', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel',
  'netlify', 'cloudflare', 'digitalocean', 'docker', 'kubernetes', 'k8s',
  'terraform', 'ansible', 'jenkins', 'github actions', 'gitlab ci', 'circleci',
  'travis', 'ci/cd', 'cicd', 'devops', 'sre', 'linux', 'unix', 'nginx',
  'apache', 'cdn', 'microservices', 'serverless', 'lambda', 'ecs', 'eks',
  
  // AI/ML
  'machine learning', 'ml', 'deep learning', 'ai', 'artificial intelligence',
  'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn', 'numpy',
  'pandas', 'scipy', 'opencv', 'nlp', 'natural language', 'computer vision',
  'neural network', 'transformers', 'huggingface', 'llm', 'gpt', 'bert',
  'openai', 'langchain', 'rag', 'embeddings', 'vector database', 'pinecone',
  
  // Data
  'data science', 'data engineering', 'data analysis', 'analytics', 'etl',
  'data pipeline', 'airflow', 'spark', 'hadoop', 'hive', 'kafka', 'rabbitmq',
  'bigquery', 'redshift', 'snowflake', 'tableau', 'powerbi', 'looker', 'dbt',
  
  // Mobile
  'ios', 'android', 'react native', 'flutter', 'xamarin', 'cordova',
  'ionic', 'expo', 'mobile development', 'app development', 'swift ui',
  
  // Testing
  'jest', 'mocha', 'chai', 'cypress', 'playwright', 'selenium', 'puppeteer',
  'testing', 'unit testing', 'e2e', 'tdd', 'bdd', 'qa', 'junit', 'pytest',
  'vitest', 'storybook',
  
  // Tools & Practices
  'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack',
  'agile', 'scrum', 'kanban', 'rest', 'restful', 'api', 'restapi', 'soap',
  'grpc', 'websocket', 'oauth', 'jwt', 'authentication', 'authorization',
  'security', 'encryption', 'https', 'ssl', 'tls',
  
  // Soft Skills / Roles
  'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
  'management', 'project management', 'product management', 'scrum master',
  'tech lead', 'architect', 'senior', 'junior', 'mid-level', 'principal',
  'staff', 'mentor', 'mentoring',
]);

/**
 * Simple Porter Stemmer implementation for English.
 * Reduces words to their root form.
 */
export function stem(word: string): string {
  word = word.toLowerCase();
  
  // Step 1: Remove common suffixes
  const suffixes = [
    { suffix: 'ational', replacement: 'ate' },
    { suffix: 'tional', replacement: 'tion' },
    { suffix: 'ization', replacement: 'ize' },
    { suffix: 'isation', replacement: 'ise' },
    { suffix: 'fulness', replacement: 'ful' },
    { suffix: 'ousness', replacement: 'ous' },
    { suffix: 'iveness', replacement: 'ive' },
    { suffix: 'ement', replacement: '' },
    { suffix: 'ment', replacement: '' },
    { suffix: 'able', replacement: '' },
    { suffix: 'ible', replacement: '' },
    { suffix: 'ance', replacement: '' },
    { suffix: 'ence', replacement: '' },
    { suffix: 'ing', replacement: '' },
    { suffix: 'tion', replacement: 't' },
    { suffix: 'sion', replacement: 's' },
    { suffix: 'ness', replacement: '' },
    { suffix: 'ity', replacement: '' },
    { suffix: 'ally', replacement: '' },
    { suffix: 'ful', replacement: '' },
    { suffix: 'ous', replacement: '' },
    { suffix: 'ive', replacement: '' },
    { suffix: 'ize', replacement: '' },
    { suffix: 'ise', replacement: '' },
    { suffix: 'ate', replacement: '' },
    { suffix: 'ify', replacement: '' },
    { suffix: 'ly', replacement: '' },
    { suffix: 'er', replacement: '' },
    { suffix: 'ed', replacement: '' },
    { suffix: 'es', replacement: '' },
    { suffix: 's', replacement: '' },
  ];
  
  for (const { suffix, replacement } of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      return word.slice(0, -suffix.length) + replacement;
    }
  }
  
  return word;
}

/**
 * Tokenizes text into individual words.
 * 
 * @param text - The text to tokenize
 * @param options - Processing options
 * @returns Array of tokens
 */
export function tokenize(text: string, options: TextProcessingOptions = {}): string[] {
  const {
    removeStopWords = true,
    lowercase = true,
    stemming = false,
    minWordLength = 2,
    maxTokens,
  } = options;
  
  // Normalize text
  let normalized = text;
  if (lowercase) {
    normalized = normalized.toLowerCase();
  }
  
  // Split into tokens
  const tokens = normalized
    .replace(/[^\w\s-]/g, ' ')  // Remove punctuation except hyphens
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim()
    .split(' ')
    .filter(token => token.length >= minWordLength);
  
  // Process tokens
  let processed = tokens;
  
  if (removeStopWords) {
    processed = processed.filter(token => !STOP_WORDS.has(token.toLowerCase()));
  }
  
  if (stemming) {
    processed = processed.map(stem);
  }
  
  // Remove duplicates while preserving order
  const seen = new Set<string>();
  processed = processed.filter(token => {
    const key = token.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  if (maxTokens && processed.length > maxTokens) {
    processed = processed.slice(0, maxTokens);
  }
  
  return processed;
}

/**
 * Extracts n-grams from text.
 * 
 * @param tokens - Array of tokens
 * @param n - Size of n-grams (1 = unigrams, 2 = bigrams, etc.)
 * @returns Array of n-grams
 */
export function nGrams(tokens: string[], n: number): string[] {
  if (n < 1 || tokens.length < n) return [];
  
  const grams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join(' '));
  }
  return grams;
}

/**
 * Calculates word frequency in a text.
 * 
 * @param text - The text to analyze
 * @returns Map of word to frequency count
 */
export function wordFrequency(text: string): Map<string, number> {
  const tokens = tokenize(text, { removeStopWords: true, lowercase: true });
  const freq = new Map<string, number>();
  
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  
  return freq;
}

/**
 * Extracts keywords from text using TF-based scoring.
 * 
 * @param text - The text to extract keywords from
 * @param maxKeywords - Maximum number of keywords to return
 * @returns Array of extracted keywords with scores
 */
export function extractKeywords(text: string, maxKeywords: number = 20): ExtractedKeyword[] {
  const tokens = tokenize(text, { removeStopWords: true, lowercase: true, minWordLength: 3 });
  const freq = new Map<string, number>();
  
  // Count frequencies
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  
  // Also extract bigrams for technical terms
  const bigrams = nGrams(tokens, 2);
  for (const bigram of bigrams) {
    // Only keep bigrams that appear multiple times or contain known skills
    const words = bigram.split(' ');
    const isSkillBigram = words.some(w => TECH_SKILLS.has(w));
    if (isSkillBigram) {
      freq.set(bigram, (freq.get(bigram) || 0) + 1);
    }
  }
  
  // Calculate scores
  const totalTokens = tokens.length || 1;
  const keywords: ExtractedKeyword[] = [];
  
  for (const [keyword, count] of freq.entries()) {
    // Boost score for known skills
    const isSkill = TECH_SKILLS.has(keyword.toLowerCase()) || 
                    keyword.split(' ').some(w => TECH_SKILLS.has(w.toLowerCase()));
    const skillBoost = isSkill ? 1.5 : 1;
    
    // Calculate normalized score
    const tf = count / totalTokens;
    const score = Math.min(tf * skillBoost * 10, 1);
    
    keywords.push({
      keyword,
      score,
      frequency: count,
      isSkill,
    });
  }
  
  // Sort by score descending
  keywords.sort((a, b) => b.score - a.score);
  
  return keywords.slice(0, maxKeywords);
}

/**
 * Extracts skills from text by matching against known skill database.
 * 
 * @param text - The text to extract skills from
 * @returns Array of found skills with confidence scores
 */
export function extractSkills(text: string): Array<{ skill: string; confidence: number }> {
  const lowerText = text.toLowerCase();
  const skills: Array<{ skill: string; confidence: number }> = [];
  const found = new Set<string>();
  
  for (const skill of TECH_SKILLS) {
    // Check for exact match (word boundary)
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerText) && !found.has(skill)) {
      found.add(skill);
      
      // Count occurrences for confidence
      const matches = lowerText.match(new RegExp(regex, 'gi'));
      const count = matches?.length || 1;
      const confidence = Math.min(0.5 + count * 0.1, 1);
      
      skills.push({ skill, confidence });
    }
  }
  
  // Sort by confidence
  skills.sort((a, b) => b.confidence - a.confidence);
  
  return skills;
}

/**
 * Calculates text similarity using Jaccard index.
 * 
 * @param text1 - First text
 * @param text2 - Second text
 * @returns Similarity score between 0 and 1
 */
export function jaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1, { removeStopWords: true, lowercase: true }));
  const tokens2 = new Set(tokenize(text2, { removeStopWords: true, lowercase: true }));
  
  if (tokens1.size === 0 && tokens2.size === 0) return 1;
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  
  let intersection = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) intersection++;
  }
  
  const union = tokens1.size + tokens2.size - intersection;
  return intersection / union;
}

/**
 * Normalizes company names for comparison.
 * 
 * @param name - Company name to normalize
 * @returns Normalized company name
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co|plc|gmbh|ag|sa)\b\.?/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts years of experience mentioned in text.
 * 
 * @param text - Text to analyze
 * @returns Object with min and max years found
 */
export function extractExperienceYears(text: string): { min: number; max: number } | null {
  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/gi,
    /(?:minimum|min|at least)\s*(\d+)\s*(?:years?|yrs?)/gi,
    /(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?|yrs?)/gi,
  ];
  
  let min = Infinity;
  let max = -Infinity;
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const year1 = parseInt(match[1], 10);
      const year2 = match[2] ? parseInt(match[2], 10) : year1;
      
      min = Math.min(min, year1);
      max = Math.max(max, year1, year2);
    }
  }
  
  if (min === Infinity) return null;
  return { min, max: max === -Infinity ? min : max };
}

/**
 * Detects the primary industry from job description.
 * 
 * @param text - Job description text
 * @returns Detected industry or null
 */
export function detectIndustry(text: string): string | null {
  const industries: Record<string, string[]> = {
    'Technology': ['software', 'tech', 'saas', 'startup', 'engineering', 'developer', 'programming'],
    'Finance': ['bank', 'finance', 'fintech', 'investment', 'trading', 'hedge fund', 'financial'],
    'Healthcare': ['health', 'medical', 'hospital', 'pharma', 'biotech', 'clinical', 'patient'],
    'E-commerce': ['ecommerce', 'e-commerce', 'retail', 'marketplace', 'shopping', 'store'],
    'Education': ['education', 'edtech', 'learning', 'school', 'university', 'academic', 'teaching'],
    'Media': ['media', 'entertainment', 'streaming', 'content', 'publishing', 'video', 'music'],
    'Gaming': ['game', 'gaming', 'esports', 'mobile games', 'console', 'game development'],
    'Consulting': ['consulting', 'advisory', 'strategy', 'management consulting'],
    'Automotive': ['automotive', 'car', 'vehicle', 'electric vehicle', 'ev', 'mobility'],
    'Aerospace': ['aerospace', 'aviation', 'space', 'defense', 'satellite'],
  };
  
  const lowerText = text.toLowerCase();
  const scores: Record<string, number> = {};
  
  for (const [industry, keywords] of Object.entries(industries)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        score += 1;
      }
    }
    if (score > 0) {
      scores[industry] = score;
    }
  }
  
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;
  
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/**
 * Generates a summary of text using extractive summarization.
 * 
 * @param text - Text to summarize
 * @param maxSentences - Maximum number of sentences in summary
 * @returns Summarized text
 */
export function extractiveSummary(text: string, maxSentences: number = 3): string {
  // Split into sentences
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .filter(s => s.trim().length > 20);
  
  if (sentences.length <= maxSentences) {
    return sentences.join(' ');
  }
  
  // Score sentences by keyword density
  const keywords = extractKeywords(text, 10);
  const keywordSet = new Set(keywords.map(k => k.keyword.toLowerCase()));
  
  const scoredSentences = sentences.map((sentence, index) => {
    const tokens = tokenize(sentence, { removeStopWords: true, lowercase: true });
    let score = 0;
    
    for (const token of tokens) {
      if (keywordSet.has(token)) score += 1;
    }
    
    // Boost first sentences (often contain key info)
    if (index === 0) score *= 1.5;
    if (index === 1) score *= 1.2;
    
    return { sentence, score, index };
  });
  
  // Sort by score and take top sentences
  scoredSentences.sort((a, b) => b.score - a.score);
  const topSentences = scoredSentences.slice(0, maxSentences);
  
  // Sort by original order for coherence
  topSentences.sort((a, b) => a.index - b.index);
  
  return topSentences.map(s => s.sentence).join(' ');
}
