
import fs from 'fs';
import { LearnedData } from './types';

export function loadLearned(dataFile: string): LearnedData {
    try {
        if (!fs.existsSync(dataFile)) {
            console.warn(`Data file not found at ${dataFile}. Creating an empty file.`);
            const initialData: LearnedData = {
                keywords: {},
                userStats: {
                    totalKeywordsLearned: 0,
                    totalPhrasesLearned: 0,
                    totalAttempts: 0,
                    totalCorrectAttempts: 0,
                    sessionHistory: [],
                },
            };
            fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        const data = fs.readFileSync(dataFile, 'utf-8');
        return JSON.parse(data) as LearnedData;
    } catch (error) {
        console.error('Error loading learned data:', error);
        throw error;
    }
}

export function saveLearned(dataFile: string, learned: LearnedData): void {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(learned, null, 2));
    } catch (error) {
        console.error('Error saving learned data:', error);
        throw error;
    }
}