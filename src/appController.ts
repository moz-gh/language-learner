import readline from 'readline';
import { loadConfig, saveConfig } from './config/configManager';
import { loadLearned, saveLearned } from './data/dataManager';
import { createPhraseFormula, getNewPhrase, gradeTranslation } from './formulaic/formulaicService';
import { LearnedPhrase } from './data/types';
import { AppConfig } from './config/types';

export class AppController {
    private config: AppConfig;
    private learned: LearnedPhrase[];
    private initializedKeywords: string[] = [];

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

        this.initializedKeywords = [
            'hello', 'world', 'language', 'learn', 'food',
            'water', 'friend', 'family', 'help', 'please'
        ];
        console.debug('Initialized important keywords:', this.initializedKeywords);
    }

    async startLesson(): Promise<void> {
        const keyword = this.getNextKeyword();
        console.debug('Using keyword for grounding:', keyword);

        const phrase = await getNewPhrase(this.config.apiKey, this.config.formulaId, {
            ...this.config,
            keyword
        });

        console.debug('New phrase generated:', phrase);

        if (phrase) {
            this.storeNewKeyword(keyword, phrase);
            this.notifyUser(phrase, keyword);

            // Wait for user input and process the translation
            const userInput = await this.getUserInput('Please provide your translation: ');
            await this.finishLesson(userInput);
        }
    }

    async finishLesson(userInput: string): Promise<void> {
        const last = this.learned[this.learned.length - 1];

        try {
            const grade = await gradeTranslation(this.config.apiKey, this.config.formulaId, {
                ...this.config,
                userInput,
                correctPhrase: last.phrase
            });

            console.debug('Grading result:', grade);
            if (grade === 'correct') last.learned = true;

            saveLearned(this.config.dataFile, this.learned);
        } catch (error) {
            console.error('Error grading user input:', error);
        }
    }

    private async getUserInput(prompt: string): Promise<string> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(prompt, (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    }

    private getNextKeyword(): string {
        const unlearnedKeywords = this.initializedKeywords.filter(
            (kw) => !this.learned.some((lp) => lp.keyword === kw && lp.learned)
        );

        if (unlearnedKeywords.length > 0) {
            return unlearnedKeywords[0];
        }

        return this.learned[Math.floor(Math.random() * this.learned.length)]?.keyword || 'default';
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
}
