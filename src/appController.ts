import { stdin as input, stdout as output } from "process";
import { loadConfig, saveConfig } from "./config/configManager";
import { loadLearned } from "./dataManager";
import {
  createPhraseFormula,
  getNewPhrase,
  gradeTranslation,
} from "./formulaic/formulaicService";
import { LearnedData } from "./types";
import { AppConfig } from "./config/types";
import { createInterface } from "readline";

export class AppController {
  private config!: AppConfig;
  private learned!: LearnedData;
  private initializedKeywords: string[] = [
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
  private rl = createInterface({ input, output });

  constructor() {
    this.rl.on("close", () => {
      console.log("Goodbye! Keep learning! 👋");
      process.exit(0);
    });
  }

  async initialize(): Promise<void> {
    this.showWelcomeMessage();

    this.config = await loadConfig();
    this.learned = loadLearned(this.config.dataFile);

    if (!this.config.formulaId) {
      this.config.formulaId = await createPhraseFormula(
        this.config.apiKey,
        this.config
      );
      saveConfig(this.config);
    }
  }

  async mainLoop(): Promise<void> {
    while (true) {
      const { keyword, phrase } = await this.startLesson();

      while (true) {
        const userInput = await this.getUserInput(
          'Provide your translation (or type "skip" to get a new phrase): '
        );

        if (userInput.toLowerCase() === "skip") {
          console.log("🔄 Skipping this phrase. Generating a new one...");
          break; // Restart loop with a new phrase
        }

        const grade = await this.finishLesson(userInput, keyword, phrase);
        if (grade.correct) {
          console.log("✅ Correct! Moving to the next lesson.");
          break; // Move to next keyword
        } else {
          console.log(`❌ Incorrect. ${grade.lesson}`);
          console.log('Try again or type "skip" to move on.');
        }
      }
    }
  }

  async startLesson(): Promise<{ keyword: string; phrase: string }> {
    const keyword = this.getRandomKeyword();

    const phrase = await getNewPhrase(
      this.config.apiKey,
      this.config.formulaId,
      {
        ...this.config,
        keyword,
      }
    );

    if (!phrase) {
      console.error(
        `⚠️ Failed to generate a phrase for "${keyword}". Retrying...`
      );
      return await this.startLesson();
    }

    console.log(`Keyword: ${keyword}`);
    console.log(`Translate the phrase: ${phrase}`);
    return { keyword, phrase };
  }

  async finishLesson(
    userInput: string,
    keyword: string,
    phrase: string
  ): Promise<{ correct: boolean; lesson: string }> {
    try {
      return await gradeTranslation(this.config.apiKey, this.config.formulaId, {
        ...this.config,
        userInput,
        correctPhrase: phrase,
      });
    } catch (error) {
      console.error("❌ Error grading user input:", error);
      return { correct: false, lesson: "Error grading input." };
    }
  }

  private async getUserInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        this.rl.pause(); // Prevents duplicate inputs
        resolve(answer.trim());
      });
    });
  }

  private getRandomKeyword(): string {
    return this.initializedKeywords[
      Math.floor(Math.random() * this.initializedKeywords.length)
    ];
  }

  private showWelcomeMessage(): void {
    const hour = new Date().getHours();
    let greeting = "Hello";

    if (hour < 12) greeting = "Good morning";
    else if (hour < 18) greeting = "Good afternoon";
    else greeting = "Good evening";

    console.log(`
  ╔═══════════════════════════════════╗
  ║  📚 Welcome to Language Learner!  ║
  ╚═══════════════════════════════════╝
  ${greeting}! Ready to improve your language skills? 🌍
  
  - You’ll be given a phrase in your target language.
  - Type your best translation or "skip" to try another phrase.
  - Let’s get started!
  `);
  }
}
