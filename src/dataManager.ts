import fs from 'fs';
import { LearnedPhrase } from './types';

export function loadLearned(dataFile: string): LearnedPhrase[] {
    try {
        // Ensure the file exists; create it if missing
        if (!fs.existsSync(dataFile)) {
            console.warn(`Data file not found at ${dataFile}. Creating an empty file.`);
            fs.writeFileSync(dataFile, JSON.stringify([], null, 2)); // Create an empty array
        }

        const data = fs.readFileSync(dataFile, 'utf-8');
        return JSON.parse(data) as LearnedPhrase[];
    } catch (error) {
        console.error('Error loading learned data:', error);
        throw error;
    }
}

export function saveLearned(dataFile: string, learned: LearnedPhrase[]): void {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(learned, null, 2));
    } catch (error) {
        console.error('Error saving learned data:', error);
        throw error;
    }
}