
export interface Phrase {
  phrase: string;
  lessons: string[];
  learned: boolean;
  attempts: number;
  correct_attempts: number;
  last_attempted: string | null; // ISO timestamp or null
}

export interface KeywordData {
  phrases: Phrase[];
}

export interface LearnedData {
  keywords: Record<string, KeywordData>;
  userStats: {
    totalKeywordsLearned: number;
    totalPhrasesLearned: number;
    totalAttempts: number;
    totalCorrectAttempts: number;
    sessionHistory: Array<{
      sessionStart: string;
      sessionEnd: string;
      keywordsCovered: string[];
      accuracy: number;
    }>;
  };
}