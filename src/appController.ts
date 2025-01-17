
import { stdin as input, stdout as output } from 'process';
import { loadConfig, saveConfig } from './config/configManager';
import { loadLearned, saveLearned } from './dataManager';
import { createPhraseFormula, getNewPhrase, gradeTranslation } from './formulaic/formulaicService';
import { LearnedPhrase } from './types';
import { AppConfig } from './config/types';
import { createInterface } from 'readline/promises';

export class AppController {
    private config!: AppConfig;
    private learned!: LearnedPhrase[];
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
            'yes', 'no', 'thank you', 'please', 'hello',
            'goodbye', 'how', 'what', 'where', 'why',
            'food', 'water', 'bathroom', 'help', 'name',
            'time', 'day', 'friend', 'family', 'money'
        ];

        console.debug('Initialized important keywords:', this.initializedKeywords);
    }

    async mainLoop(): Promise<void> {
        while (true) {
            const { keyword, phrase } = await this.startLesson();
            let resolved = false;

            while (!resolved) {
                const userInput = await this.getUserInput(
                    'Please provide your translation (or type "skip" or just hit enter to move on): '
                );

                if (userInput.toLowerCase() === 'skip' || userInput.trim() === '') {
                    console.log('Skipping this phrase. Moving to the next lesson.');
                    resolved = true;
                    break;
                }

                const grade = await this.finishLesson(userInput, phrase);

                if (grade.correct) {
                    console.log('Correct! Moving to the next lesson.');
                    resolved = true;
                } else {
                    console.log(grade.lesson);
                    console.log('Incorrect. Try again or type "skip" to move on.');
                }
            }
        }
    }

    async startLesson(): Promise<{ keyword: string; phrase: string }> {
        const keyword = this.getNextKeyword();
        console.debug('Using keyword for grounding:', keyword);

        const phrase = await getNewPhrase(this.config.apiKey, this.config.formulaId, {
            ...this.config,
            keyword
        });

        if (phrase) {
            this.storeNewKeyword(keyword, phrase);
            this.notifyUser(phrase, keyword);
            return { keyword, phrase };
        } else {
            console.error('Failed to generate a new phrase. Retrying...');
            return await this.startLesson();
        }
    }

    async finishLesson(userInput: string, correctPhrase: string): Promise<{ correct: boolean; lesson: string }> {
        try {
            const grade = await gradeTranslation(this.config.apiKey, this.config.formulaId, {
                ...this.config,
                userInput,
                correctPhrase
            });

            if (grade.correct) {
                const last = this.learned[this.learned.length - 1];
                last.learned = true;
                saveLearned(this.config.dataFile, this.learned);
            }

            return grade;
        } catch (error) {
            console.error('Error grading user input:', error);
            return { correct: false, lesson: 'Error grading input' };
        }
    }

    private async getUserInput(prompt: string): Promise<string> {
        const rl = createInterface({ input, output });
        try {
            const answer = await rl.question(prompt);
            return answer;
        } finally {
            rl.close();
        }
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