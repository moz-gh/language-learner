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
import chalk from "chalk"; // for colored output

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

  // Game state: current streak and lives
  private currentStreak: number = 0;
  private lives: number = 3; // You can adjust this value for difficulty

  // Enable autocomplete for slash commands.
  private rl = createInterface({
    input,
    output,
    completer: (line: string) => {
      const commands = ["/skip", "/explain", "/help", "/exit"];
      const hits = commands.filter((cmd) => cmd.startsWith(line));
      return [hits.length ? hits : commands, line];
    },
  });

  constructor() {
    this.rl.on("close", () => {
      console.log(chalk.green("Goodbye! Keep learning! 👋"));
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
    // Continue the game while the player has lives remaining.
    while (this.lives > 0) {
      const { keyword, phrase } = await this.startLesson();

      // Inner loop for a single phrase.
      while (true) {
        // Display current game status.
        console.log(
          chalk.blue(
            `Streak: ${this.currentStreak}    Lives: ${this.getHearts()}`
          )
        );
        const userInput = await this.getUserInput("Translation: ");

        // Handle slash commands.
        if (userInput.startsWith("/")) {
          const command = userInput.trim().toLowerCase();
          switch (command) {
            case "/skip":
              console.log(chalk.yellow("🔄 Skipping this phrase..."));
              // Reset the streak on skip.
              this.currentStreak = 0;
              break;
            case "/explain":
              console.log(chalk.blue("💡 Generating explanation..."));
              try {
                const explanation = await explainPhrase(
                  this.config.apiKey,
                  this.config.formulaId,
                  { ...this.config, phrase }
                );
                if (explanation) {
                  const boxedExplanation = this.formatBoxedText(
                    explanation.split("\n")
                  );
                  console.log("\n" + boxedExplanation + "\n");
                } else {
                  console.log(chalk.red("❌ No explanation available."));
                }
              } catch (err) {
                console.error(
                  chalk.red("❌ Error generating explanation:"),
                  err
                );
              }
              continue; // Allow the user to try again.
            case "/help":
              console.log("Commands:");
              console.log("  /skip    - Skip the current phrase.");
              console.log("  /explain - Get a word-by-word explanation.");
              console.log("  /exit    - Exit the application.");
              continue;
            case "/exit":
              this.rl.close();
              return;
            default:
              console.log(
                chalk.red("Unknown command. Type /help for commands.")
              );
              continue;
          }
          // If /skip was used, break out to the next phrase.
          if (command === "/skip") break;
        }

        // Regular translation attempt.
        const grade = await this.finishLesson(userInput, keyword, phrase);
        if (grade.correct) {
          this.currentStreak++;
          console.log(
            chalk.green(
              `✅ Correct! Streak increased to ${this.currentStreak}.`
            )
          );
          break; // Move on to the next phrase.
        } else {
          // Penalize the player for an incorrect answer.
          this.lives--;
          this.currentStreak = 0;
          console.log(chalk.red(`❌ Incorrect. ${grade.lesson}`));
          console.log(chalk.red(`Lives remaining: ${this.getHearts()}`));
          if (this.lives <= 0) {
            console.log(chalk.red("Game Over! Better luck next time."));
            process.exit(0);
          }
          // Allow the user to try again for the same phrase.
        }
      }
    }
  }

  async startLesson(): Promise<{ keyword: string; phrase: string }> {
    const keyword = this.getRandomKeyword();
    const phrase = await getNewPhrase(
      this.config.apiKey,
      this.config.formulaId,
      { ...this.config, keyword }
    );

    if (!phrase) {
      console.error(
        chalk.red(
          `⚠️ Failed to generate a phrase for "${keyword}". Retrying...`
        )
      );
      return await this.startLesson();
    }

    // Display the keyword and phrase in a simple rectangular box.
    const boxedText = this.formatBoxedText([
      `Keyword: ${keyword}`,
      `Phrase: ${phrase}`,
    ]);
    console.log("\n" + boxedText + "\n");
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
      console.error(chalk.red("❌ Error grading user input:"), error);
      return { correct: false, lesson: "Error grading input." };
    }
  }

  private async getUserInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        this.rl.pause();
        resolve(answer.trim());
      });
    });
  }

  private getRandomKeyword(): string {
    return this.initializedKeywords[
      Math.floor(Math.random() * this.initializedKeywords.length)
    ];
  }

  /**
   * Formats an array of lines into a simple rectangular box.
   */
  private formatBoxedText(lines: string[]): string {
    const maxLength = Math.max(...lines.map((line) => line.length));
    const horizontalBorder = "═".repeat(maxLength + 2);
    const topBorder = `╔${horizontalBorder}╗`;
    const bottomBorder = `╚${horizontalBorder}╝`;
    const content = lines
      .map((line) => `║ ${line.padEnd(maxLength)} ║`)
      .join("\n");
    return `${topBorder}\n${content}\n${bottomBorder}`;
  }

  /**
   * Returns a string of heart symbols representing current lives.
   */
  private getHearts(): string {
    return "❤️".repeat(this.lives);
  }

  private showWelcomeMessage(): void {
    // Enhanced welcome banner with help text.
    console.log(
      chalk.green(
        `
╔════════════════════════════════════════╗
║        Welcome to Language Learner!    ║
║                                        ║
║  Commands:                             ║
║    /skip    - Skip current phrase      ║
║    /explain - Explain the phrase       ║
║    /help    - Show available commands  ║
║    /exit    - Exit the application     ║
╚════════════════════════════════════════╝
        `
      )
    );
  }
}
