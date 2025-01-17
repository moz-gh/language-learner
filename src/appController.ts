import { loadConfig, saveConfig } from './config/configManager';
import { loadLearned, saveLearned } from './data/dataManager';
import { createPhraseFormula, getNewPhrase } from './formulaic/formulaicService';
import { LearnedPhrase } from './data/types';
import { AppConfig } from './config/types';

export class AppController {
    private config: AppConfig;
    private learned: LearnedPhrase[];

    async initialize(): Promise<void> {
        console.debug('Initializing AppController...');

        this.config = await loadConfig();
        console.debug('Config loaded:', this.config);

        this.learned = loadLearned(this.config.dataFile);
        console.debug('Learned phrases loaded:', this.learned);

        if (!this.config.formulaId) {
            console.debug('Formula ID not found, creating new formula...');
            this.config.formulaId = await createPhraseFormula(this.config.apiKey, this.config);
            saveConfig(this.config);
            console.debug('New formula created and config saved:', this.config.formulaId);
        }
    }

    async startLesson(): Promise<void> {
        const phrase = await getNewPhrase(this.config.apiKey, this.config.formulaId, this.config);
        console.debug('New phrase generated:', phrase);
        if (phrase) {
            const keyword = this.extractKeyword(phrase);
            this.storeNewKeyword(keyword, phrase);
            this.notifyUser(phrase, keyword);
        }
    }

    finishLesson(userInput: string): void {
        const last = this.learned[this.learned.length - 1];
        const result = this.gradeUserInput(userInput, last.phrase);
        if (result === 'correct') last.learned = true;
        saveLearned(this.config.dataFile, this.learned);
    }

    private extractKeyword(phrase: string): string {
        const words = phrase.split(' ');
        return words.length > 0 ? words[0] : '';
    }

    private storeNewKeyword(keyword: string, phrase: string): void {
        const newEntry: LearnedPhrase = { keyword, phrase, learned: false };
        this.learned.push(newEntry);
        saveLearned(this.config.dataFile, this.learned);
    }

    private notifyUser(phrase: string, keyword: string): void {
        console.log(`New phrase: ${phrase}`);
        console.log(`Keyword to learn: ${keyword}`);
    }

    private gradeUserInput(input: string, correctPhrase: string): 'correct' | 'incorrect' {
        return input.trim().toLowerCase() === correctPhrase.trim().toLowerCase() ? 'correct' : 'incorrect';
    }
}
