// src/formulaic/formulaicService.ts
import { Formulaic } from 'formulaic-node';
import { Formula, CompletionData } from './types';

export async function createFormulaIfNeeded(apiKey: string, config: AppConfig): Promise<string> {
    const formulaic = new Formulaic(apiKey);
    const newFormula: Formula = {
        id: '',
        name: 'Language Learning Phrase Generator',
        description: 'Generates phrases in the target language with highlighted keywords for learning.',
        variables: [
            { name: 'userLang', value: config.userLang, type: 'text' },
            { name: 'targetLang', value: config.targetLang, type: 'text' },
            { name: 'difficulty', value: 'medium', type: 'text' }
        ],
        model: 'gpt-4o-mini', // Adjust the model as needed
        prompts: [
            {
                text: 'Generate a {{{difficulty}}} difficulty phrase in {{{targetLang}}} for a {{{userLang}}} speaker, highlighting a keyword.'
            }
        ]
    };
    try {
        const response = await formulaic.createFormula(newFormula);
        return response.id;
    } catch (error) {
        console.error('Error creating formula:', error);
        throw error;
    }
}

export async function getNewPhrase(apiKey: string, formulaId: string, config: AppConfig): Promise<string | null> {
    const formulaic = new Formulaic(apiKey);
    const completionData: CompletionData = {
        models: ['gpt-4o-mini'], // Adjust the model as needed
        variables: [
            { name: 'userLang', value: config.userLang },
            { name: 'targetLang', value: config.targetLang },
            { name: 'difficulty', value: 'medium' }
        ]
    };
    try {
        const response = await formulaic.createCompletion(formulaId, completionData);
        return response.result; // Adjust based on actual response structure
    } catch (error) {
        console.error('Error fetching new phrase:', error);
        return null;
    }
}
