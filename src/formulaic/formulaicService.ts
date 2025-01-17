// src/formulaic/formulaicService.ts
import { FormulaData, Formulaic } from 'formulaic-node';
import { CompletionData } from './types';
import { AppConfig } from '../config/types';

export async function createPhraseFormula(apiKey: string, config: AppConfig): Promise<string> {
    const formulaic = new Formulaic(apiKey);
    const newFormula: FormulaData = {
        name: 'Language Learning Phrase Generator',
        description: 'Generates phrases in the target language with highlighted keywords for learning.',
        variables: [
            { name: 'userLang', value: config.userLang },
            { name: 'targetLang', value: config.targetLang },
            { name: 'difficulty', value: 'medium' }
        ],
        model: 'gpt-4o-mini', // Adjust the model as needed
        prompts: [
            {
                text: `Generate a {{{difficulty}}} difficulty phrase in {{{targetLang}}} for a {{{userLang}}} speaker, highlighting a keyword if provided.
            Only provide the phrase in the target language {{{targetLang}}}. 
            Only provide plain text, no formatting.
            `,
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
        models: ['gpt-4o'], // Adjust the model as needed
        variables: [
            { name: 'userLang', value: config.userLang },
            { name: 'targetLang', value: config.targetLang },
            { name: 'difficulty', value: 'medium' }
        ]
    };
    try {
        const response = await formulaic.createCompletion(formulaId, completionData);
        // log the response for debugging
        const messages = response[0].chat.messages

        const assistantMessages = messages.filter((message: { role: string; }) => message.role === 'assistant');
        const assistantMessage = assistantMessages[assistantMessages.length - 1];
        return assistantMessage.content // Adjust based on actual response structure
    } catch (error) {
        console.error('Error fetching new phrase:', error);
        return null;
    }
}
