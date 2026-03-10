/**
 * TF-IDF (Term Frequency - Inverse Document Frequency) implementation.
 * Used for document similarity, keyword extraction, and matching resumes to jobs.
 * @module lib/ai/tfidf
 */

import { tokenize, TECH_SKILLS } from './nlp';
import { TFIDFDocument, TFIDFVector, SimilarityResult } from './types';

/**
 * TF-IDF processor for document analysis and comparison.
 * Supports incremental document addition and similarity queries.
 */
export class TFIDFProcessor {
  private documents: Map<string, TFIDFDocument> = new Map();
  private vectors: Map<string, TFIDFVector> = new Map();
  private documentFrequency: Map<string, number> = new Map();
  private totalDocuments: number = 0;
  
  /**
   * Adds a document to the corpus.
   * 
   * @param doc - Document to add
   */
  addDocument(doc: TFIDFDocument): void {
    this.documents.set(doc.id, doc);
    this.totalDocuments++;
    
    // Update document frequency
    const tokens = new Set(tokenize(doc.content, { 
      removeStopWords: true, 
      lowercase: true,
      minWordLength: 2 
    }));
    
    for (const token of tokens) {
      this.documentFrequency.set(
        token, 
        (this.documentFrequency.get(token) || 0) + 1
      );
    }
    
    // Compute TF-IDF vector
    this.computeVector(doc.id);
  }
  
  /**
   * Adds multiple documents to the corpus.
   * 
   * @param docs - Array of documents to add
   */
  addDocuments(docs: TFIDFDocument[]): void {
    for (const doc of docs) {
      this.documents.set(doc.id, doc);
      this.totalDocuments++;
      
      const tokens = new Set(tokenize(doc.content, { 
        removeStopWords: true, 
        lowercase: true,
        minWordLength: 2 
      }));
      
      for (const token of tokens) {
        this.documentFrequency.set(
          token, 
          (this.documentFrequency.get(token) || 0) + 1
        );
      }
    }
    
    // Recompute all vectors after adding all documents
    for (const docId of this.documents.keys()) {
      this.computeVector(docId);
    }
  }
  
  /**
   * Removes a document from the corpus.
   * 
   * @param docId - ID of document to remove
   */
  removeDocument(docId: string): void {
    const doc = this.documents.get(docId);
    if (!doc) return;
    
    // Update document frequency
    const tokens = new Set(tokenize(doc.content, { 
      removeStopWords: true, 
      lowercase: true,
      minWordLength: 2 
    }));
    
    for (const token of tokens) {
      const freq = this.documentFrequency.get(token) || 0;
      if (freq <= 1) {
        this.documentFrequency.delete(token);
      } else {
        this.documentFrequency.set(token, freq - 1);
      }
    }
    
    this.documents.delete(docId);
    this.vectors.delete(docId);
    this.totalDocuments--;
    
    // Recompute vectors for accuracy
    for (const id of this.documents.keys()) {
      this.computeVector(id);
    }
  }
  
  /**
   * Computes the TF-IDF vector for a document.
   * 
   * @param docId - Document ID
   */
  private computeVector(docId: string): void {
    const doc = this.documents.get(docId);
    if (!doc) return;
    
    const tokens = tokenize(doc.content, { 
      removeStopWords: true, 
      lowercase: true,
      minWordLength: 2 
    });
    
    // Calculate term frequencies
    const tf = new Map<string, number>();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }
    
    // Calculate TF-IDF for each term
    const tfidf = new Map<string, number>();
    let magnitude = 0;
    
    for (const [term, freq] of tf.entries()) {
      // TF: log normalized
      const termFreq = 1 + Math.log(freq);
      
      // IDF: log of total documents / documents containing term
      const docFreq = this.documentFrequency.get(term) || 1;
      const inverseDocFreq = Math.log(this.totalDocuments / docFreq);
      
      const score = termFreq * inverseDocFreq;
      
      // Boost for known skills
      const boost = TECH_SKILLS.has(term) ? 1.3 : 1;
      const finalScore = score * boost;
      
      tfidf.set(term, finalScore);
      magnitude += finalScore * finalScore;
    }
    
    magnitude = Math.sqrt(magnitude);
    
    this.vectors.set(docId, {
      docId,
      terms: tfidf,
      magnitude,
    });
  }
  
  /**
   * Computes TF-IDF vector for a query (not stored in corpus).
   * 
   * @param text - Query text
   * @returns TF-IDF vector
   */
  private computeQueryVector(text: string): TFIDFVector {
    const tokens = tokenize(text, { 
      removeStopWords: true, 
      lowercase: true,
      minWordLength: 2 
    });
    
    const tf = new Map<string, number>();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }
    
    const tfidf = new Map<string, number>();
    let magnitude = 0;
    
    for (const [term, freq] of tf.entries()) {
      const termFreq = 1 + Math.log(freq);
      const docFreq = this.documentFrequency.get(term) || 1;
      const inverseDocFreq = Math.log((this.totalDocuments + 1) / docFreq);
      
      const score = termFreq * inverseDocFreq;
      const boost = TECH_SKILLS.has(term) ? 1.3 : 1;
      const finalScore = score * boost;
      
      tfidf.set(term, finalScore);
      magnitude += finalScore * finalScore;
    }
    
    magnitude = Math.sqrt(magnitude);
    
    return {
      docId: 'query',
      terms: tfidf,
      magnitude,
    };
  }
  
  /**
   * Calculates cosine similarity between two vectors.
   * 
   * @param v1 - First vector
   * @param v2 - Second vector
   * @returns Cosine similarity (0-1)
   */
  private cosineSimilarity(v1: TFIDFVector, v2: TFIDFVector): number {
    if (v1.magnitude === 0 || v2.magnitude === 0) return 0;
    
    let dotProduct = 0;
    for (const [term, score] of v1.terms.entries()) {
      const otherScore = v2.terms.get(term);
      if (otherScore !== undefined) {
        dotProduct += score * otherScore;
      }
    }
    
    return dotProduct / (v1.magnitude * v2.magnitude);
  }
  
  /**
   * Finds similar documents to a query.
   * 
   * @param query - Query text
   * @param topK - Number of results to return
   * @returns Array of document IDs with similarity scores
   */
  findSimilar(query: string, topK: number = 10): Array<{ docId: string; score: number }> {
    const queryVector = this.computeQueryVector(query);
    const results: Array<{ docId: string; score: number }> = [];
    
    for (const [docId, vector] of this.vectors.entries()) {
      const score = this.cosineSimilarity(queryVector, vector);
      results.push({ docId, score });
    }
    
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
  
  /**
   * Calculates detailed similarity between two texts.
   * 
   * @param text1 - First text
   * @param text2 - Second text
   * @returns Detailed similarity result
   */
  compareTwoTexts(text1: string, text2: string): SimilarityResult {
    const tokens1 = tokenize(text1, { removeStopWords: true, lowercase: true, minWordLength: 2 });
    const tokens2 = tokenize(text2, { removeStopWords: true, lowercase: true, minWordLength: 2 });
    
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    // Jaccard similarity
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    const jaccardSimilarity = intersection.size / union.size;
    
    // Cosine similarity using TF-IDF
    // Create temporary processor for these two documents
    const tempProcessor = new TFIDFProcessor();
    tempProcessor.addDocuments([
      { id: 'doc1', content: text1 },
      { id: 'doc2', content: text2 },
    ]);
    
    const results = tempProcessor.findSimilar(text1, 2);
    const cosineScore = results.find(r => r.docId === 'doc2')?.score || 0;
    
    // Common terms
    const commonTerms = [...intersection];
    
    // Unique terms
    const uniqueToFirst = [...set1].filter(x => !set2.has(x));
    const uniqueToSecond = [...set2].filter(x => !set1.has(x));
    
    return {
      cosineSimilarity: cosineScore,
      jaccardSimilarity,
      commonTerms,
      uniqueToFirst,
      uniqueToSecond,
    };
  }
  
  /**
   * Gets the top terms for a document.
   * 
   * @param docId - Document ID
   * @param topK - Number of terms to return
   * @returns Array of terms with scores
   */
  getTopTerms(docId: string, topK: number = 10): Array<{ term: string; score: number }> {
    const vector = this.vectors.get(docId);
    if (!vector) return [];
    
    const terms: Array<{ term: string; score: number }> = [];
    for (const [term, score] of vector.terms.entries()) {
      terms.push({ term, score });
    }
    
    terms.sort((a, b) => b.score - a.score);
    return terms.slice(0, topK);
  }
  
  /**
   * Gets all terms in the vocabulary with their document frequencies.
   * 
   * @returns Map of term to document frequency
   */
  getVocabulary(): Map<string, number> {
    return new Map(this.documentFrequency);
  }
  
  /**
   * Gets the number of documents in the corpus.
   */
  get documentCount(): number {
    return this.totalDocuments;
  }
  
  /**
   * Serializes the processor state for caching.
   * 
   * @returns Serialized state as JSON string
   */
  serialize(): string {
    return JSON.stringify({
      documents: Array.from(this.documents.entries()),
      documentFrequency: Array.from(this.documentFrequency.entries()),
      totalDocuments: this.totalDocuments,
    });
  }
  
  /**
   * Deserializes processor state from cache.
   * 
   * @param data - Serialized state JSON string
   */
  static deserialize(data: string): TFIDFProcessor {
    const parsed = JSON.parse(data);
    const processor = new TFIDFProcessor();
    
    processor.documents = new Map(parsed.documents);
    processor.documentFrequency = new Map(parsed.documentFrequency);
    processor.totalDocuments = parsed.totalDocuments;
    
    // Recompute vectors
    for (const docId of processor.documents.keys()) {
      processor.computeVector(docId);
    }
    
    return processor;
  }
}

/**
 * Calculates match score between a job description and resume.
 * 
 * @param jobDescription - Job description text
 * @param resume - Resume/CV text
 * @returns Match score (0-100) and breakdown
 */
export function calculateJobResumeMatch(
  jobDescription: string,
  resume: string
): {
  score: number;
  breakdown: {
    skillsMatch: number;
    keywordsMatch: number;
    experienceMatch: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
} {
  const processor = new TFIDFProcessor();
  processor.addDocuments([
    { id: 'job', content: jobDescription },
    { id: 'resume', content: resume },
  ]);
  
  const similarity = processor.compareTwoTexts(jobDescription, resume);
  
  // Extract skills from both
  const jobTokens = tokenize(jobDescription, { removeStopWords: true, lowercase: true });
  const resumeTokens = tokenize(resume, { removeStopWords: true, lowercase: true });
  
  const jobSkills = new Set(jobTokens.filter(t => TECH_SKILLS.has(t)));
  const resumeSkills = new Set(resumeTokens.filter(t => TECH_SKILLS.has(t)));
  
  const matchedSkills = [...jobSkills].filter(s => resumeSkills.has(s));
  const missingSkills = [...jobSkills].filter(s => !resumeSkills.has(s));
  
  // Calculate component scores
  const skillsMatch = jobSkills.size > 0 
    ? (matchedSkills.length / jobSkills.size) * 100 
    : 100;
  
  const keywordsMatch = similarity.cosineSimilarity * 100;
  
  // Experience match (simplified - could be enhanced)
  const experienceMatch = similarity.jaccardSimilarity * 100;
  
  // Overall score (weighted average)
  const score = Math.round(
    skillsMatch * 0.4 + 
    keywordsMatch * 0.4 + 
    experienceMatch * 0.2
  );
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 5);
    recommendations.push(
      `Consider adding these skills to your resume: ${topMissing.join(', ')}`
    );
  }
  
  if (skillsMatch < 50) {
    recommendations.push(
      'Your skills section could better match the job requirements. Review the job posting for key technologies.'
    );
  }
  
  if (keywordsMatch < 40) {
    recommendations.push(
      'Try incorporating more keywords from the job description into your resume.'
    );
  }
  
  if (score >= 70) {
    recommendations.push(
      'Good match! Consider tailoring your experience bullets to highlight relevant projects.'
    );
  }
  
  return {
    score,
    breakdown: {
      skillsMatch: Math.round(skillsMatch),
      keywordsMatch: Math.round(keywordsMatch),
      experienceMatch: Math.round(experienceMatch),
    },
    matchedSkills,
    missingSkills,
    recommendations,
  };
}
