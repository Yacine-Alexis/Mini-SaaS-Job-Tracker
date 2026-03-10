/**
 * Machine Learning Classifier for trainable AI features.
 * Implements Naive Bayes and K-Nearest Neighbors classifiers.
 * @module lib/ai/classifier
 */

import { tokenize, TECH_SKILLS } from './nlp';
import { TrainingExample } from './types';

/**
 * Naive Bayes text classifier.
 * Suitable for tag suggestions, industry classification, and sentiment analysis.
 */
export class NaiveBayesClassifier {
  private labelCounts: Map<string, number> = new Map();
  private wordCounts: Map<string, Map<string, number>> = new Map();
  private vocabulary: Set<string> = new Set();
  private totalDocuments: number = 0;
  private smoothing: number = 1; // Laplace smoothing
  
  /**
   * Trains the classifier with a single example.
   * 
   * @param text - Training text
   * @param label - Label/category for the text
   */
  train(text: string, label: string): void {
    const tokens = tokenize(text, { 
      removeStopWords: true, 
      lowercase: true, 
      minWordLength: 2 
    });
    
    // Update label count
    this.labelCounts.set(label, (this.labelCounts.get(label) || 0) + 1);
    this.totalDocuments++;
    
    // Update word counts for this label
    if (!this.wordCounts.has(label)) {
      this.wordCounts.set(label, new Map());
    }
    const labelWords = this.wordCounts.get(label)!;
    
    for (const token of tokens) {
      this.vocabulary.add(token);
      labelWords.set(token, (labelWords.get(token) || 0) + 1);
    }
  }
  
  /**
   * Trains the classifier with multiple examples.
   * 
   * @param examples - Array of training examples
   */
  trainBatch(examples: TrainingExample[]): void {
    for (const example of examples) {
      this.train(example.text, example.label);
    }
  }
  
  /**
   * Predicts the label for a text.
   * 
   * @param text - Text to classify
   * @returns Predicted label and confidence scores
   */
  predict(text: string): { label: string; confidence: number; scores: Map<string, number> } {
    const tokens = tokenize(text, { 
      removeStopWords: true, 
      lowercase: true, 
      minWordLength: 2 
    });
    
    const scores = new Map<string, number>();
    const vocabSize = this.vocabulary.size;
    
    for (const [label, labelCount] of this.labelCounts.entries()) {
      // Prior probability P(label)
      let logProb = Math.log(labelCount / this.totalDocuments);
      
      const labelWords = this.wordCounts.get(label)!;
      const totalWordsInLabel = Array.from(labelWords.values()).reduce((a, b) => a + b, 0);
      
      // Likelihood P(word|label) for each word
      for (const token of tokens) {
        const wordCount = labelWords.get(token) || 0;
        // Laplace smoothing
        const probability = (wordCount + this.smoothing) / 
                           (totalWordsInLabel + this.smoothing * vocabSize);
        logProb += Math.log(probability);
      }
      
      scores.set(label, logProb);
    }
    
    // Find best label
    let bestLabel = '';
    let bestScore = -Infinity;
    
    for (const [label, score] of scores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestLabel = label;
      }
    }
    
    // Convert log probabilities to confidence (normalize)
    const maxScore = bestScore;
    let sumExp = 0;
    for (const score of scores.values()) {
      sumExp += Math.exp(score - maxScore);
    }
    const confidence = 1 / sumExp; // Softmax-normalized confidence
    
    return { label: bestLabel, confidence, scores };
  }
  
  /**
   * Gets top N predictions with probabilities.
   * 
   * @param text - Text to classify
   * @param topN - Number of predictions to return
   * @returns Array of labels with confidence scores
   */
  predictTopN(text: string, topN: number = 3): Array<{ label: string; confidence: number }> {
    const { scores } = this.predict(text);
    
    // Convert log scores to probabilities using softmax
    const maxScore = Math.max(...scores.values());
    let sumExp = 0;
    const expScores = new Map<string, number>();
    
    for (const [label, score] of scores.entries()) {
      const exp = Math.exp(score - maxScore);
      expScores.set(label, exp);
      sumExp += exp;
    }
    
    const results: Array<{ label: string; confidence: number }> = [];
    for (const [label, exp] of expScores.entries()) {
      results.push({ label, confidence: exp / sumExp });
    }
    
    results.sort((a, b) => b.confidence - a.confidence);
    return results.slice(0, topN);
  }
  
  /**
   * Gets all labels the classifier knows about.
   */
  getLabels(): string[] {
    return Array.from(this.labelCounts.keys());
  }
  
  /**
   * Serializes the classifier for storage.
   */
  serialize(): string {
    return JSON.stringify({
      labelCounts: Array.from(this.labelCounts.entries()),
      wordCounts: Array.from(this.wordCounts.entries()).map(([label, words]) => 
        [label, Array.from(words.entries())]
      ),
      vocabulary: Array.from(this.vocabulary),
      totalDocuments: this.totalDocuments,
      smoothing: this.smoothing,
    });
  }
  
  /**
   * Deserializes the classifier from storage.
   */
  static deserialize(data: string): NaiveBayesClassifier {
    const parsed = JSON.parse(data);
    const classifier = new NaiveBayesClassifier();
    
    classifier.labelCounts = new Map(parsed.labelCounts);
    classifier.wordCounts = new Map(
      parsed.wordCounts.map(([label, words]: [string, [string, number][]]) => 
        [label, new Map(words)]
      )
    );
    classifier.vocabulary = new Set(parsed.vocabulary);
    classifier.totalDocuments = parsed.totalDocuments;
    classifier.smoothing = parsed.smoothing;
    
    return classifier;
  }
}

/**
 * K-Nearest Neighbors classifier for similarity-based classification.
 * Better for small datasets and when examples are important.
 */
export class KNNClassifier {
  private examples: Array<{ features: Map<string, number>; label: string }> = [];
  private k: number;
  
  constructor(k: number = 5) {
    this.k = k;
  }
  
  /**
   * Converts text to feature vector (TF-normalized).
   */
  private textToFeatures(text: string): Map<string, number> {
    const tokens = tokenize(text, { 
      removeStopWords: true, 
      lowercase: true, 
      minWordLength: 2 
    });
    
    const freq = new Map<string, number>();
    for (const token of tokens) {
      freq.set(token, (freq.get(token) || 0) + 1);
    }
    
    // Normalize by total tokens
    const total = tokens.length || 1;
    const features = new Map<string, number>();
    for (const [term, count] of freq.entries()) {
      features.set(term, count / total);
    }
    
    return features;
  }
  
  /**
   * Calculates cosine similarity between two feature vectors.
   */
  private cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;
    
    for (const [term, scoreA] of a.entries()) {
      magA += scoreA * scoreA;
      const scoreB = b.get(term);
      if (scoreB !== undefined) {
        dotProduct += scoreA * scoreB;
      }
    }
    
    for (const scoreB of b.values()) {
      magB += scoreB * scoreB;
    }
    
    const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
  
  /**
   * Adds a training example.
   * 
   * @param text - Training text
   * @param label - Label/category
   */
  train(text: string, label: string): void {
    const features = this.textToFeatures(text);
    this.examples.push({ features, label });
  }
  
  /**
   * Trains with multiple examples.
   */
  trainBatch(examples: TrainingExample[]): void {
    for (const example of examples) {
      this.train(example.text, example.label);
    }
  }
  
  /**
   * Predicts the label for a text using K nearest neighbors.
   * 
   * @param text - Text to classify
   * @returns Predicted label and confidence
   */
  predict(text: string): { label: string; confidence: number; neighbors: Array<{ label: string; similarity: number }> } {
    const features = this.textToFeatures(text);
    
    // Calculate similarity to all examples
    const similarities: Array<{ label: string; similarity: number }> = [];
    for (const example of this.examples) {
      const similarity = this.cosineSimilarity(features, example.features);
      similarities.push({ label: example.label, similarity });
    }
    
    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    // Take top K neighbors
    const neighbors = similarities.slice(0, this.k);
    
    // Vote by weighted similarity
    const votes = new Map<string, number>();
    for (const neighbor of neighbors) {
      votes.set(neighbor.label, (votes.get(neighbor.label) || 0) + neighbor.similarity);
    }
    
    // Find best label
    let bestLabel = '';
    let bestScore = 0;
    let totalScore = 0;
    
    for (const [label, score] of votes.entries()) {
      totalScore += score;
      if (score > bestScore) {
        bestScore = score;
        bestLabel = label;
      }
    }
    
    const confidence = totalScore > 0 ? bestScore / totalScore : 0;
    
    return { label: bestLabel, confidence, neighbors };
  }
  
  /**
   * Gets example count by label.
   */
  getLabelCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const example of this.examples) {
      counts.set(example.label, (counts.get(example.label) || 0) + 1);
    }
    return counts;
  }
  
  /**
   * Gets the total number of training examples.
   */
  get exampleCount(): number {
    return this.examples.length;
  }
  
  /**
   * Serializes the classifier.
   */
  serialize(): string {
    return JSON.stringify({
      examples: this.examples.map(e => ({
        features: Array.from(e.features.entries()),
        label: e.label,
      })),
      k: this.k,
    });
  }
  
  /**
   * Deserializes the classifier.
   */
  static deserialize(data: string): KNNClassifier {
    const parsed = JSON.parse(data);
    const classifier = new KNNClassifier(parsed.k);
    
    classifier.examples = parsed.examples.map((e: { features: [string, number][]; label: string }) => ({
      features: new Map(e.features),
      label: e.label,
    }));
    
    return classifier;
  }
}

/**
 * Pre-built classifier for suggesting job tags based on description.
 * Can be enhanced with user feedback over time.
 */
export function createTagSuggestionClassifier(): NaiveBayesClassifier {
  const classifier = new NaiveBayesClassifier();
  
  // Pre-train with common job categories and their typical keywords
  const trainingData: TrainingExample[] = [
    // Technology roles
    { text: 'frontend developer react javascript typescript css html web development ui user interface responsive design', label: 'Frontend' },
    { text: 'backend developer server api database postgresql mongodb express nodejs python django flask microservices', label: 'Backend' },
    { text: 'full stack developer frontend backend both client server web application end to end', label: 'Full Stack' },
    { text: 'mobile developer ios android react native flutter swift kotlin mobile app application', label: 'Mobile' },
    { text: 'devops engineer ci cd pipeline kubernetes docker aws azure deployment infrastructure automation', label: 'DevOps' },
    { text: 'machine learning engineer ai artificial intelligence deep learning tensorflow pytorch neural networks nlp', label: 'AI/ML' },
    { text: 'data scientist data analysis analytics python pandas statistics machine learning insights visualization', label: 'Data Science' },
    { text: 'data engineer etl pipeline spark hadoop data warehouse bigquery snowflake data infrastructure', label: 'Data Engineering' },
    { text: 'security engineer cybersecurity penetration testing vulnerability security compliance encryption', label: 'Security' },
    { text: 'qa engineer testing automation selenium cypress jest playwright quality assurance test cases', label: 'QA/Testing' },
    
    // Seniority levels
    { text: 'senior experienced lead architect mentor years experience leadership technical decisions', label: 'Senior' },
    { text: 'junior entry level graduate early career learning growth mentorship training', label: 'Junior' },
    { text: 'staff principal distinguished expert industry leader technical vision strategy', label: 'Staff+' },
    
    // Work arrangements
    { text: 'remote work from home anywhere distributed team fully remote async communication', label: 'Remote' },
    { text: 'hybrid onsite office days flexible remote partially in person', label: 'Hybrid' },
    { text: 'onsite office location in person headquarters on-site daily', label: 'On-site' },
    
    // Company types
    { text: 'startup early stage fast paced equity stock options growth opportunity small team venture funded', label: 'Startup' },
    { text: 'enterprise large corporation established company fortune 500 global organization', label: 'Enterprise' },
    { text: 'fintech financial technology banking payments cryptocurrency blockchain trading', label: 'Fintech' },
    { text: 'healthcare medical health patient clinical hospital pharma biotech', label: 'Healthcare' },
    { text: 'ecommerce retail shopping marketplace online store commerce', label: 'E-commerce' },
    { text: 'saas software as a service subscription cloud platform b2b product', label: 'SaaS' },
    
    // Specific technologies (adds multiple tags)
    { text: 'python programming language scripting automation data science django flask fastapi', label: 'Python' },
    { text: 'javascript typescript programming web development frontend nodejs react vue angular', label: 'JavaScript' },
    { text: 'java programming language enterprise spring boot android kotlin jvm', label: 'Java' },
    { text: 'golang go programming language performance concurrent microservices', label: 'Go' },
    { text: 'rust programming language systems performance memory safety', label: 'Rust' },
    { text: 'aws amazon web services cloud ec2 s3 lambda rds ecs eks', label: 'AWS' },
    { text: 'kubernetes k8s container orchestration docker pods deployment scaling', label: 'Kubernetes' },
  ];
  
  classifier.trainBatch(trainingData);
  return classifier;
}

/**
 * Pre-built classifier for identifying interview question types.
 */
export function createInterviewTypeClassifier(): NaiveBayesClassifier {
  const classifier = new NaiveBayesClassifier();
  
  const trainingData: TrainingExample[] = [
    // Behavioral
    { text: 'tell me about a time when you describe a situation where give an example of challenging conflict teamwork leadership failure', label: 'behavioral' },
    { text: 'how did you handle describe your approach to working with difficult past experience dealing with', label: 'behavioral' },
    
    // Technical
    { text: 'implement design build code algorithm data structure system architecture technical whiteboard coding', label: 'technical' },
    { text: 'explain how works difference between optimize performance complexity big o time space', label: 'technical' },
    { text: 'write a function program code to solve implement debug review code', label: 'technical' },
    
    // Situational
    { text: 'what would you do if how would you handle imagine scenario hypothetical situation approach', label: 'situational' },
    { text: 'if you were faced with suppose assume given the situation', label: 'situational' },
    
    // Role-specific
    { text: 'experience with specific technology framework tool process methodology industry', label: 'role-specific' },
    { text: 'why this role interested in position company team product mission', label: 'role-specific' },
    
    // Culture fit
    { text: 'work style prefer environment team collaboration communication values culture fit', label: 'company-culture' },
    { text: 'ideal workplace company culture work life balance management style team dynamics', label: 'company-culture' },
  ];
  
  classifier.trainBatch(trainingData);
  return classifier;
}
