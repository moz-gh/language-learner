import { stdin as input, stdout as output } from "process";
import { loadConfig, saveConfig } from "./config/configManager";
import { loadLearned, saveLearned } from "./dataManager";
import {
  createPhraseFormula,
  getNewPhrase,
  gradeTranslation,
} from "./formulaic/formulaicService";
import { LearnedData, Phrase } from "./types";
import { AppConfig } from "./config/types";
import { createInterface } from "readline/promises";

export class AppController {
  private config!: AppConfig;
  private learned!: LearnedData;
  private initializedKeywords: string[] = [];

  async initialize(): Promise<void> {
    // console.debug('Initializing AppController...');

    this.config = await loadConfig();
    // console.debug('Config loaded:', this.config);

    this.learned = loadLearned(this.config.dataFile);
    // console.debug('Learned phrases loaded:', this.learned);

    if (!this.config.formulaId) {
      // console.debug('Formula ID not found, creating new formula...');
      this.config.formulaId = await createPhraseFormula(
        this.config.apiKey,
        this.config
      );
      saveConfig(this.config);
      // console.debug('New formula created and config saved:', this.config.formulaId);
    }

    this.initializedKeywords = [
      "yes",
      "no",
      "thank you",
      "please",
      "hello",
      "goodbye",
      "how",
      "what",
      "where",
      "why",
      "food",
      "water",
      "bathroom",
      "help",
      "name",
      "time",
      "day",
      "friend",
      "family",
      "money",
    ];

    // console.debug('Initialized important keywords:', this.initializedKeywords);
    this.addMissingKeywords();
  }

  async mainLoop(): Promise<void> {
    while (true) {
      const { keyword, phrase } = await this.startLesson();
      let resolved = false;

      while (!resolved) {
        const userInput = await this.getUserInput(
          'Please provide your translation (or type "skip" or just hit enter to move on): '
        );

        if (userInput.toLowerCase() === "skip" || userInput.trim() === "") {
          console.log("Skipping this phrase. Moving to the next lesson.");
          resolved = true;
          break;
        }

        const grade = await this.finishLesson(userInput, keyword, phrase);

        if (grade.correct) {
          console.log("Correct! Moving to the next lesson.");
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
    if (!keyword) {
      console.log("No unlearned keywords remaining. Congratulations!");
      process.exit(0);
    }

    const phrase = await getNewPhrase(
      this.config.apiKey,
      this.config.formulaId,
      {
        ...this.config,
        keyword,
      }
    );

    if (!phrase) {
      console.error(`Failed to generate a new phrase for keyword: ${keyword}`);
      return await this.startLesson(); // Retry with a new keyword
    }

    this.storeGeneratedPhrase(keyword, phrase);

    console.log(`Keyword: ${keyword}`);
    console.log(`Phrase: ${phrase}`);
    return { keyword, phrase };
  }

  async finishLesson(
    userInput: string,
    keyword: string,
    phrase: string
  ): Promise<{ correct: boolean; lesson: string }> {
    try {
      const grade = await gradeTranslation(
        this.config.apiKey,
        this.config.formulaId,
        {
          ...this.config,
          userInput,
          correctPhrase: phrase,
        }
      );

      const learnedPhrase = this.learned.keywords[keyword].phrases.find(
        (p) => p.phrase === phrase
      );
      if (learnedPhrase) {
        learnedPhrase.attempts += 1;
        if (grade.correct) {
          learnedPhrase.learned = true;
          learnedPhrase.correct_attempts += 1;
          console.log("Correct! Moving to the next lesson.");
        } else {
          console.log(grade.lesson);
          console.log('Incorrect. Try again or type "skip" to move on.');
        }
        learnedPhrase.last_attempted = new Date().toISOString();
        saveLearned(this.config.dataFile, this.learned);
      }

      return grade;
    } catch (error) {
      console.error("Error grading user input:", error);
      return { correct: false, lesson: "Error grading input" };
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

  private getNextKeyword(): string | null {
    const unlearnedKeywords = Object.keys(this.learned.keywords).filter(
      (keyword) => {
        const keywordData = this.learned.keywords[keyword];
        return (
          keywordData.phrases.length === 0 || // No phrases yet
          keywordData.phrases.some((phrase) => !phrase.learned) // At least one phrase unlearned
        );
      }
    );

    return unlearnedKeywords.length > 0 ? unlearnedKeywords[0] : null;
  }

  private storeGeneratedPhrase(keyword: string, phrase: string): void {
    if (!this.learned.keywords[keyword]) {
      this.learned.keywords[keyword] = { phrases: [] };
    }

    const existingPhrase = this.learned.keywords[keyword].phrases.find(
      (p) => p.phrase === phrase
    );
    if (!existingPhrase) {
      this.learned.keywords[keyword].phrases.push({
        phrase,
        lessons: [`Using ${keyword}`],
        learned: false,
        attempts: 0,
        correct_attempts: 0,
        last_attempted: null,
      });
      saveLearned(this.config.dataFile, this.learned);
    }
  }

  private addMissingKeywords(): void {
    for (const keyword of this.initializedKeywords) {
      if (!this.learned.keywords[keyword]) {
        this.learned.keywords[keyword] = { phrases: [] };
      }
    }

    saveLearned(this.config.dataFile, this.learned);
  }
}
