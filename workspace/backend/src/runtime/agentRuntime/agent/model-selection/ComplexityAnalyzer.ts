/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.COMPLEXITYANALYZER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = ComplexityAnalyzer module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\runtime\agentRuntime\agent\model-selection\ComplexityAnalyzer.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

/**
 * Task complexity analyzer
 * Analyzes task descriptions to determine complexity level using heuristics
 */

import { ComplexityLevel, TaskType } from './types.js';

/**
 * Keywords that indicate simple tasks
 */
const SIMPLE_INDICATORS = [
  'list',
  'show',
  'check',
  'status',
  'help',
  'what',
  'display',
  'print',
  'get',
  'view',
  'see',
  'find',
  'tell',
  'info',
  'read',
];

/**
 * Keywords that indicate complex tasks
 */
const COMPLEX_INDICATORS = [
  'refactor',
  'analyze',
  'research',
  'optimize',
  'design',
  'architect',
  'implement',
  'develop',
  'create',
  'build',
  'migrate',
  'integrate',
  'rewrite',
  'transform',
  'restructure',
  'investigate',
];

/**
 * Length thresholds for complexity scoring
 */
const LENGTH_THRESHOLDS = {
  VERY_SIMPLE_MAX: 50,    // < 50 chars very likely simple (strong signal)
  SIMPLE_MAX: 100,        // < 100 chars somewhat likely simple (weak signal)
  COMPLEX_MIN: 500,       // > 500 chars likely complex
};

/**
 * ComplexityAnalyzer class
 * Analyzes task descriptions using keyword and length-based heuristics
 */
export class ComplexityAnalyzer {
  /**
   * Analyze a task description and determine its complexity
   * 
   * Uses multiple heuristics:
   * 1. Keyword matching (simple vs complex indicators)
   * 2. Length-based scoring
   * 3. Pattern matching for action verbs
   * 
   * @param taskDescription - The task description to analyze
   * @returns Complexity level: 'simple' | 'medium' | 'complex'
   * 
   * @example
   * ```typescript
   * const analyzer = new ComplexityAnalyzer();
   * 
   * analyzer.analyze('list files'); // 'simple'
   * analyzer.analyze('refactor the authentication system'); // 'complex'
   * analyzer.analyze('update documentation'); // 'medium'
   * ```
   */
  analyze(taskDescription: string): ComplexityLevel {
    if (!taskDescription || taskDescription.trim().length === 0) {
      return 'medium'; // Default for empty descriptions
    }

    const normalizedTask = taskDescription.toLowerCase().trim();
    
    // Calculate scores for different complexity indicators
    const simpleScore = this.calculateSimpleScore(normalizedTask);
    const complexScore = this.calculateComplexScore(normalizedTask);
    const lengthScore = this.calculateLengthScore(taskDescription);

    // Combine scores to determine final complexity
    const totalScore = complexScore - simpleScore + lengthScore;

    // Apply thresholds
    if (totalScore <= -1.0) {
      return 'simple';
    } else if (totalScore >= 1.0) {
      return 'complex';
    } else {
      return 'medium';
    }
  }

  /**
   * Calculate simple task score based on keyword matching
   * Returns positive score if simple indicators found
   */
  private calculateSimpleScore(normalizedTask: string): number {
    let score = 0;
    
    // Check for simple indicators at start of task (weighted higher)
    const words = normalizedTask.split(/\s+/);
    const firstWord = words[0];
    
    if (SIMPLE_INDICATORS.includes(firstWord)) {
      score += 2.0; // Strong signal if first word is simple indicator
    }
    
    // Check for simple indicators anywhere in task (lighter weight)
    for (const indicator of SIMPLE_INDICATORS) {
      if (normalizedTask.includes(indicator)) {
        score += 0.3;
      }
    }
    
    return score;
  }

  /**
   * Calculate complex task score based on keyword matching
   * Returns positive score if complex indicators found
   */
  private calculateComplexScore(normalizedTask: string): number {
    let score = 0;
    
    // Check for complex indicators at start of task (weighted higher)
    const words = normalizedTask.split(/\s+/);
    const firstWord = words[0];
    
    if (COMPLEX_INDICATORS.includes(firstWord)) {
      score += 2.0; // Strong signal if first word is complex indicator
    }
    
    // Check for complex indicators anywhere in task
    for (const indicator of COMPLEX_INDICATORS) {
      if (normalizedTask.includes(indicator)) {
        score += 0.3;
      }
    }
    
    return score;
  }

  /**
   * Calculate complexity score based on task length
   * 
   * - Tasks < 20 chars: likely terse commands (-0.5)
   * - Tasks 20-100 chars: neutral (0) - let keywords decide
   * - Tasks 100-500 chars: neutral (0)
   * - Tasks > 500 chars: likely complex (+1)
   */
  private calculateLengthScore(taskDescription: string): number {
    const length = taskDescription.length;
    
    if (length < 20) {
      return -0.5; // Very terse, slightly favor simple (but not decisive)
    } else if (length > LENGTH_THRESHOLDS.COMPLEX_MIN) {
      return 1; // Long task, likely complex
    } else {
      return 0; // Neutral - let keywords decide
    }
  }

  /**
   * Analyze and return detailed scoring information
   * Useful for debugging and understanding complexity decisions
   * 
   * @param taskDescription - The task description to analyze
   * @returns Object containing complexity level and scoring details
   */
  analyzeDetailed(taskDescription: string): {
    complexity: ComplexityLevel;
    scores: {
      simple: number;
      complex: number;
      length: number;
      total: number;
    };
    indicators: {
      simpleKeywords: string[];
      complexKeywords: string[];
    };
  } {
    const normalizedTask = taskDescription.toLowerCase().trim();
    
    const simpleScore = this.calculateSimpleScore(normalizedTask);
    const complexScore = this.calculateComplexScore(normalizedTask);
    const lengthScore = this.calculateLengthScore(taskDescription);
    const totalScore = complexScore - simpleScore + lengthScore;
    
    // Find matching keywords
    const simpleKeywords = SIMPLE_INDICATORS.filter(indicator => 
      normalizedTask.includes(indicator)
    );
    const complexKeywords = COMPLEX_INDICATORS.filter(indicator => 
      normalizedTask.includes(indicator)
    );
    
    // Determine complexity
    let complexity: ComplexityLevel;
    if (totalScore <= -1.0) {
      complexity = 'simple';
    } else if (totalScore >= 1.0) {
      complexity = 'complex';
    } else {
      complexity = 'medium';
    }
    
    return {
      complexity,
      scores: {
        simple: simpleScore,
        complex: complexScore,
        length: lengthScore,
        total: totalScore,
      },
      indicators: {
        simpleKeywords,
        complexKeywords,
      },
    };
  }

  /**
   * Infer task type from task description
   * 
   * Uses keyword matching to determine task type:
   * - CODING: code, program, function, class, test, debug, etc.
   * - RESEARCH: research, investigate, analyze, study, compare, etc.
   * - DATA_PROCESSING: data, process, parse, transform, aggregate, etc.
   * - GENERAL: everything else
   * 
   * @param taskDescription - Task description to analyze
   * @returns Inferred task type
   * 
   * @example
   * ```typescript
   * analyzer.inferTaskType('Write a function'); // TaskType.CODING
   * analyzer.inferTaskType('Research best practices'); // TaskType.RESEARCH
   * analyzer.inferTaskType('Hello'); // TaskType.GENERAL
   * ```
   */
  inferTaskType(taskDescription: string): TaskType {
    if (!taskDescription || taskDescription.trim().length === 0) {
      return TaskType.GENERAL;
    }

    const normalized = taskDescription.toLowerCase();

    // Coding indicators
    const codingKeywords = [
      'code', 'program', 'function', 'class', 'method', 'test',
      'debug', 'fix', 'implement', 'write', 'develop', 'script',
      'api', 'library', 'package', 'module', 'compile', 'build',
    ];

    // Research indicators
    const researchKeywords = [
      'research', 'investigate', 'analyze', 'study', 'compare',
      'review', 'explore', 'survey', 'examine', 'evaluate',
      'summarize', 'explain', 'understand', 'learn',
    ];

    // Data processing indicators
    const dataKeywords = [
      'data', 'process', 'parse', 'transform', 'aggregate',
      'filter', 'sort', 'group', 'merge', 'join', 'extract',
      'clean', 'normalize', 'format', 'convert',
    ];

    // Count matches
    let codingScore = 0;
    let researchScore = 0;
    let dataScore = 0;

    for (const keyword of codingKeywords) {
      if (normalized.includes(keyword)) {
        codingScore++;
      }
    }

    for (const keyword of researchKeywords) {
      if (normalized.includes(keyword)) {
        researchScore++;
      }
    }

    for (const keyword of dataKeywords) {
      if (normalized.includes(keyword)) {
        dataScore++;
      }
    }

    // Return type with highest score
    const maxScore = Math.max(codingScore, researchScore, dataScore);

    if (maxScore === 0) {
      return TaskType.GENERAL;
    }

    if (codingScore === maxScore) {
      return TaskType.CODING;
    }

    if (researchScore === maxScore) {
      return TaskType.RESEARCH;
    }

    return TaskType.DATA_PROCESSING;
  }

  /**
   * Alias for analyze() to match expected API
   * @param taskDescription - Task description to analyze
   * @returns Complexity level
   */
  analyzeTask(taskDescription: string): ComplexityLevel {
    return this.analyze(taskDescription);
  }
}
