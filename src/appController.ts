import { stdin as input, stdout as output } from "process";
import { loadConfig, saveConfig } from "./config/configManager";
import { loadLearned } from "./dataManager";
import {
  createPhraseFormula,
  getNewPhrase,
  gradeTranslation,
  explainPhrase,
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
          'Provide your translation (or type "/skip" for a new phrase, "/explain" for an explanation, "/help" for commands, "/exit" to quit): '
        );

        // Check if the input is a command (commands start with "/")
        if (userInput.startsWith("/")) {
          const command = userInput.trim().toLowerCase();
          switch (command) {
            case "/skip":
              console.log("🔄 Skipping this phrase. Generating a new one...");
              // Break out of the inner loop to start a new lesson
              break;
            case "/explain":
              console.log("💡 Generating explanation...");
              try {
                const explanation = await explainPhrase(
                  this.config.apiKey,
                  this.config.formulaId,
                  {
                    ...this.config,
                    phrase,
                  }
                );
                if (explanation) {
                  console.log("\n" + explanation + "\n");
                } else {
                  console.log(
                    "❌ Unable to generate explanation for the phrase."
                  );
                }
              } catch (err) {
                console.error("❌ Error generating explanation:", err);
              }
              // Continue to allow the user to submit a translation
              continue;
            case "/help":
              console.log("Available commands:");
              console.log(
                "  /skip     - Skip the current phrase and get a new one."
              );
              console.log(
                "  /explain  - Get a visual breakdown explanation of the phrase."
              );
              console.log("  /exit     - Exit the application.");
              console.log("  /help     - Show this help message.");
              continue;
            case "/exit":
              this.rl.close();
              return;
            default:
              console.log(
                "Unknown command. Type /help for a list of commands."
              );
              continue;
          }
          // If we reached here with a recognized command like /skip, break out to the next phrase.
          if (command === "/skip") break;
        }

        // Regular translation attempt
        const grade = await this.finishLesson(userInput, keyword, phrase);
        if (grade.correct) {
          console.log("✅ Correct! Moving to the next lesson.");
          break; // Move to the next keyword
        } else {
          console.log(`❌ Incorrect. ${grade.lesson}`);
          console.log(
            'Try again or type a command (e.g., "/skip", "/explain", "/help", "/exit").'
          );
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

    console.log(`\nKeyword: ${keyword}`);
    console.log(`Translate the phrase: ${phrase}\n`);
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
  ╔════════════════════════════════════════╗
  ║     📚 Welcome to Language Learner!     ║
  ╚════════════════════════════════════════╝
  ${greeting}! Ready to improve your language skills? 🌍

  How to use:
    - You’ll be given a phrase in your target language.
    - Type your best translation.
    - Use commands starting with "/" for extra options:
         /skip     - Skip the current phrase.
         /explain  - Get a visual breakdown of the phrase.
         /help     - List available commands.
         /exit     - Exit the application.
  Let's get started!
  `);
  }
}
