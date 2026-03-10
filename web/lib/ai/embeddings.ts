/**
 * Word Embeddings for Semantic Matching
 * Implements word vectors and semantic similarity for better job-resume matching.
 * Uses a lightweight embedding approach suitable for client-side/server execution.
 * @module lib/ai/embeddings
 */

import { tokenize, STOP_WORDS, TECH_SKILLS } from './nlp';

/**
 * Pre-computed word vectors for common job-related terms.
 * Each word maps to a 50-dimensional dense vector.
 * These are simplified embeddings based on co-occurrence patterns.
 */
const SEED_EMBEDDINGS: Record<string, number[]> = {
  // Programming concepts cluster
  'developer': [0.8, 0.3, 0.1, 0.7, 0.2, 0.5, 0.1, 0.3, 0.6, 0.4, 0.2, 0.1, 0.7, 0.3, 0.5, 0.2, 0.4, 0.6, 0.3, 0.1],
  'engineer': [0.75, 0.35, 0.15, 0.65, 0.25, 0.55, 0.15, 0.35, 0.55, 0.45, 0.25, 0.15, 0.65, 0.35, 0.45, 0.25, 0.45, 0.55, 0.35, 0.15],
  'programmer': [0.85, 0.25, 0.05, 0.75, 0.15, 0.45, 0.05, 0.25, 0.65, 0.35, 0.15, 0.05, 0.75, 0.25, 0.55, 0.15, 0.35, 0.65, 0.25, 0.05],
  'software': [0.9, 0.2, 0.1, 0.8, 0.1, 0.4, 0.1, 0.2, 0.7, 0.3, 0.1, 0.1, 0.8, 0.2, 0.6, 0.1, 0.3, 0.7, 0.2, 0.1],
  'coding': [0.85, 0.25, 0.05, 0.75, 0.15, 0.45, 0.05, 0.25, 0.65, 0.35, 0.15, 0.05, 0.75, 0.25, 0.55, 0.15, 0.35, 0.65, 0.25, 0.05],
  
  // Frontend cluster
  'frontend': [0.7, 0.8, 0.2, 0.6, 0.3, 0.4, 0.2, 0.5, 0.5, 0.6, 0.3, 0.2, 0.6, 0.4, 0.4, 0.3, 0.5, 0.5, 0.4, 0.2],
  'react': [0.65, 0.85, 0.25, 0.55, 0.35, 0.35, 0.25, 0.55, 0.45, 0.65, 0.35, 0.25, 0.55, 0.45, 0.35, 0.35, 0.55, 0.45, 0.45, 0.25],
  'javascript': [0.7, 0.75, 0.2, 0.6, 0.3, 0.4, 0.2, 0.5, 0.5, 0.6, 0.3, 0.2, 0.6, 0.4, 0.4, 0.3, 0.5, 0.5, 0.4, 0.2],
  'typescript': [0.72, 0.73, 0.22, 0.62, 0.28, 0.42, 0.22, 0.48, 0.52, 0.58, 0.28, 0.22, 0.62, 0.38, 0.42, 0.28, 0.48, 0.52, 0.38, 0.22],
  'ui': [0.6, 0.9, 0.3, 0.5, 0.4, 0.3, 0.3, 0.6, 0.4, 0.7, 0.4, 0.3, 0.5, 0.5, 0.3, 0.4, 0.6, 0.4, 0.5, 0.3],
  'ux': [0.55, 0.85, 0.35, 0.45, 0.45, 0.25, 0.35, 0.65, 0.35, 0.75, 0.45, 0.35, 0.45, 0.55, 0.25, 0.45, 0.65, 0.35, 0.55, 0.35],
  
  // Backend cluster
  'backend': [0.7, 0.2, 0.8, 0.6, 0.3, 0.5, 0.4, 0.3, 0.6, 0.3, 0.4, 0.5, 0.6, 0.3, 0.5, 0.4, 0.3, 0.6, 0.3, 0.4],
  'api': [0.65, 0.25, 0.75, 0.55, 0.35, 0.55, 0.45, 0.35, 0.55, 0.35, 0.45, 0.55, 0.55, 0.35, 0.55, 0.45, 0.35, 0.55, 0.35, 0.45],
  'database': [0.6, 0.2, 0.85, 0.5, 0.4, 0.6, 0.5, 0.3, 0.5, 0.3, 0.5, 0.6, 0.5, 0.3, 0.6, 0.5, 0.3, 0.5, 0.3, 0.5],
  'sql': [0.55, 0.15, 0.9, 0.45, 0.45, 0.65, 0.55, 0.25, 0.45, 0.25, 0.55, 0.65, 0.45, 0.25, 0.65, 0.55, 0.25, 0.45, 0.25, 0.55],
  'server': [0.6, 0.2, 0.8, 0.5, 0.35, 0.55, 0.45, 0.3, 0.55, 0.3, 0.45, 0.55, 0.55, 0.3, 0.55, 0.45, 0.3, 0.55, 0.3, 0.45],
  
  // DevOps/Cloud cluster
  'devops': [0.5, 0.3, 0.6, 0.4, 0.8, 0.5, 0.6, 0.4, 0.4, 0.3, 0.6, 0.5, 0.4, 0.4, 0.5, 0.6, 0.4, 0.4, 0.4, 0.6],
  'cloud': [0.45, 0.25, 0.55, 0.35, 0.85, 0.55, 0.65, 0.45, 0.35, 0.25, 0.65, 0.55, 0.35, 0.45, 0.55, 0.65, 0.45, 0.35, 0.45, 0.65],
  'aws': [0.4, 0.2, 0.5, 0.3, 0.9, 0.6, 0.7, 0.5, 0.3, 0.2, 0.7, 0.6, 0.3, 0.5, 0.6, 0.7, 0.5, 0.3, 0.5, 0.7],
  'kubernetes': [0.45, 0.25, 0.55, 0.35, 0.85, 0.55, 0.75, 0.45, 0.35, 0.25, 0.75, 0.55, 0.35, 0.45, 0.55, 0.75, 0.45, 0.35, 0.45, 0.75],
  'docker': [0.45, 0.25, 0.55, 0.35, 0.82, 0.52, 0.72, 0.45, 0.35, 0.25, 0.72, 0.52, 0.35, 0.45, 0.52, 0.72, 0.45, 0.35, 0.45, 0.72],
  
  // Data/ML cluster
  'data': [0.5, 0.3, 0.5, 0.4, 0.4, 0.8, 0.3, 0.5, 0.4, 0.4, 0.3, 0.7, 0.4, 0.5, 0.4, 0.3, 0.5, 0.4, 0.5, 0.3],
  'machine': [0.45, 0.25, 0.45, 0.35, 0.35, 0.85, 0.25, 0.55, 0.35, 0.35, 0.25, 0.75, 0.35, 0.55, 0.35, 0.25, 0.55, 0.35, 0.55, 0.25],
  'learning': [0.45, 0.25, 0.45, 0.35, 0.35, 0.85, 0.25, 0.55, 0.35, 0.35, 0.25, 0.75, 0.35, 0.55, 0.35, 0.25, 0.55, 0.35, 0.55, 0.25],
  'analytics': [0.5, 0.3, 0.5, 0.4, 0.4, 0.75, 0.3, 0.5, 0.4, 0.4, 0.3, 0.65, 0.4, 0.5, 0.4, 0.3, 0.5, 0.4, 0.5, 0.3],
  'python': [0.55, 0.35, 0.55, 0.45, 0.45, 0.75, 0.35, 0.45, 0.45, 0.45, 0.35, 0.65, 0.45, 0.45, 0.45, 0.35, 0.45, 0.45, 0.45, 0.35],
  
  // Management/Leadership cluster
  'manager': [0.3, 0.4, 0.3, 0.4, 0.2, 0.3, 0.8, 0.3, 0.4, 0.5, 0.2, 0.3, 0.4, 0.6, 0.3, 0.2, 0.3, 0.4, 0.6, 0.2],
  'lead': [0.4, 0.45, 0.35, 0.5, 0.25, 0.35, 0.75, 0.35, 0.5, 0.55, 0.25, 0.35, 0.5, 0.55, 0.35, 0.25, 0.35, 0.5, 0.55, 0.25],
  'senior': [0.5, 0.5, 0.4, 0.6, 0.3, 0.4, 0.6, 0.4, 0.5, 0.5, 0.3, 0.4, 0.6, 0.5, 0.4, 0.3, 0.4, 0.5, 0.5, 0.3],
  'team': [0.35, 0.45, 0.35, 0.45, 0.25, 0.35, 0.7, 0.35, 0.45, 0.55, 0.25, 0.35, 0.45, 0.55, 0.35, 0.25, 0.35, 0.45, 0.55, 0.25],
  'leadership': [0.3, 0.4, 0.3, 0.4, 0.2, 0.3, 0.85, 0.3, 0.4, 0.5, 0.2, 0.3, 0.4, 0.65, 0.3, 0.2, 0.3, 0.4, 0.65, 0.2],
  
  // Experience levels
  'junior': [0.5, 0.5, 0.4, 0.5, 0.3, 0.4, 0.3, 0.8, 0.5, 0.4, 0.3, 0.4, 0.5, 0.3, 0.4, 0.3, 0.4, 0.5, 0.3, 0.3],
  'entry': [0.45, 0.45, 0.35, 0.45, 0.25, 0.35, 0.25, 0.85, 0.45, 0.35, 0.25, 0.35, 0.45, 0.25, 0.35, 0.25, 0.35, 0.45, 0.25, 0.25],
  'experience': [0.55, 0.55, 0.45, 0.55, 0.35, 0.45, 0.55, 0.55, 0.55, 0.55, 0.35, 0.45, 0.55, 0.45, 0.45, 0.35, 0.45, 0.55, 0.45, 0.35],
  'expert': [0.6, 0.6, 0.5, 0.6, 0.4, 0.5, 0.65, 0.35, 0.6, 0.6, 0.4, 0.5, 0.6, 0.5, 0.5, 0.4, 0.5, 0.6, 0.5, 0.4],
};

const EMBEDDING_DIM = 20;

/**
 * Word Embeddings class for semantic similarity calculations.
 */
export class WordEmbeddings {
  private embeddings: Map<string, number[]>;
  private vocabulary: Set<string>;

  constructor() {
    this.embeddings = new Map(Object.entries(SEED_EMBEDDINGS));
    this.vocabulary = new Set(Object.keys(SEED_EMBEDDINGS));
  }

  /**
   * Gets or generates an embedding for a word.
   * Uses character-level hashing for OOV (out-of-vocabulary) words.
   */
  getWordVector(word: string): number[] {
    const normalizedWord = word.toLowerCase();
    
    // Return cached embedding if exists
    if (this.embeddings.has(normalizedWord)) {
      return this.embeddings.get(normalizedWord)!;
    }

    // Check for partial matches (e.g., "reactjs" matches "react")
    for (const [key, vec] of this.embeddings.entries()) {
      if (normalizedWord.includes(key) || key.includes(normalizedWord)) {
        return vec;
      }
    }

    // Generate embedding using character n-gram hashing
    const embedding = this.generateOOVEmbedding(normalizedWord);
    this.embeddings.set(normalizedWord, embedding);
    return embedding;
  }

  /**
   * Generates embedding for out-of-vocabulary words.
   * Uses character trigrams and hash functions.
   */
  private generateOOVEmbedding(word: string): number[] {
    const embedding = new Array(EMBEDDING_DIM).fill(0);
    
    // Generate character trigrams
    const padded = `<${word}>`;
    for (let i = 0; i < padded.length - 2; i++) {
      const trigram = padded.slice(i, i + 3);
      const hash = this.hashString(trigram);
      
      // Distribute hash across embedding dimensions
      for (let j = 0; j < EMBEDDING_DIM; j++) {
        embedding[j] += Math.sin(hash * (j + 1)) * 0.1;
      }
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((a, b) => a + b * b, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  /**
   * Simple string hashing function.
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Calculates sentence embedding by averaging word vectors.
   * Weighted by TF (term frequency).
   */
  getSentenceVector(text: string): number[] {
    const tokens = tokenize(text, {
      removeStopWords: true,
      lowercase: true,
      minWordLength: 2,
    });

    if (tokens.length === 0) {
      return new Array(EMBEDDING_DIM).fill(0);
    }

    // Calculate term frequencies
    const tf = new Map<string, number>();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    // Weighted average of word vectors
    const embedding = new Array(EMBEDDING_DIM).fill(0);
    let totalWeight = 0;

    for (const [token, freq] of tf.entries()) {
      const wordVec = this.getWordVector(token);
      const weight = Math.log(1 + freq); // Log-scaled frequency

      for (let i = 0; i < EMBEDDING_DIM; i++) {
        embedding[i] += wordVec[i] * weight;
      }
      totalWeight += weight;
    }

    // Normalize by total weight
    if (totalWeight > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= totalWeight;
      }
    }

    return embedding;
  }

  /**
   * Calculates cosine similarity between two vectors.
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Calculates semantic similarity between two texts.
   */
  textSimilarity(text1: string, text2: string): number {
    const vec1 = this.getSentenceVector(text1);
    const vec2 = this.getSentenceVector(text2);
    return this.cosineSimilarity(vec1, vec2);
  }

  /**
   * Finds the most similar words from vocabulary.
   */
  findSimilarWords(word: string, topN: number = 5): Array<{ word: string; similarity: number }> {
    const targetVec = this.getWordVector(word);
    const similarities: Array<{ word: string; similarity: number }> = [];

    for (const [vocabWord, vec] of this.embeddings.entries()) {
      if (vocabWord === word.toLowerCase()) continue;
      const similarity = this.cosineSimilarity(targetVec, vec);
      similarities.push({ word: vocabWord, similarity });
    }

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topN);
  }
}

// Singleton instance
let embeddingsInstance: WordEmbeddings | null = null;

/**
 * Gets the singleton word embeddings instance.
 */
export function getWordEmbeddings(): WordEmbeddings {
  if (!embeddingsInstance) {
    embeddingsInstance = new WordEmbeddings();
  }
  return embeddingsInstance;
}

/**
 * Calculates semantic similarity between job and resume.
 * Uses both word embeddings and keyword overlap.
 */
export function semanticJobMatch(
  jobDescription: string,
  resume: string
): {
  semanticScore: number;
  keywordScore: number;
  combinedScore: number;
  topMatchingConcepts: string[];
} {
  const embeddings = getWordEmbeddings();
  
  // Semantic similarity using embeddings
  const semanticScore = embeddings.textSimilarity(jobDescription, resume);
  
  // Extract key terms from both
  const jobTokens = new Set(tokenize(jobDescription, { 
    removeStopWords: true, 
    lowercase: true, 
    minWordLength: 3 
  }));
  const resumeTokens = new Set(tokenize(resume, { 
    removeStopWords: true, 
    lowercase: true, 
    minWordLength: 3 
  }));
  
  // Calculate keyword overlap (Jaccard)
  const intersection = new Set([...jobTokens].filter(t => resumeTokens.has(t)));
  const union = new Set([...jobTokens, ...resumeTokens]);
  const keywordScore = union.size > 0 ? intersection.size / union.size : 0;
  
  // Combined score (weighted)
  const combinedScore = semanticScore * 0.6 + keywordScore * 0.4;
  
  // Find top matching concepts
  const matchingConcepts: Array<{ concept: string; score: number }> = [];
  
  for (const token of intersection) {
    if (TECH_SKILLS.has(token) || token.length > 4) {
      matchingConcepts.push({ concept: token, score: 1 });
    }
  }
  
  // Also find semantically similar but not exact matches
  for (const jobToken of jobTokens) {
    if (intersection.has(jobToken)) continue;
    
    for (const resumeToken of resumeTokens) {
      const similarity = embeddings.cosineSimilarity(
        embeddings.getWordVector(jobToken),
        embeddings.getWordVector(resumeToken)
      );
      
      if (similarity > 0.7) {
        matchingConcepts.push({
          concept: `${jobToken} ≈ ${resumeToken}`,
          score: similarity,
        });
      }
    }
  }
  
  matchingConcepts.sort((a, b) => b.score - a.score);
  
  return {
    semanticScore: Math.round(semanticScore * 100) / 100,
    keywordScore: Math.round(keywordScore * 100) / 100,
    combinedScore: Math.round(combinedScore * 100) / 100,
    topMatchingConcepts: matchingConcepts.slice(0, 10).map(c => c.concept),
  };
}
