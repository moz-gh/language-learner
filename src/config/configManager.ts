import fs from "fs";
import path from "path";
import readline from "readline";
import { AppConfig } from "./types";

const dataDir = path.join(__dirname, "../../data");
const configPath = path.join(dataDir, "config.json");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const defaultConfig: AppConfig = {
  userLang: "en",
  targetLang: "es",
  schedule: 21600000, // 6 hours in milliseconds
  apiKey: "",
  formulaId: "",
  dataFile: path.join(dataDir, "learned.json"),
};

export async function loadConfig(): Promise<AppConfig> {
  try {
    let config: AppConfig;

    if (!fs.existsSync(configPath)) {
      console.warn("Config file not found. Creating with default values...");
      config = { ...defaultConfig };
    } else {
      const data = fs.readFileSync(configPath, "utf-8");
      config = JSON.parse(data) as AppConfig;
    }
    // console.log("config.apiKey", config.apiKey)
    if (!config.apiKey) {
      console.warn("API key not found in config. Prompting user for input...");
      config.apiKey = await getApiKeyFromUser();
      saveConfig(config);
    }

    return config;
  } catch (error) {
    console.error("Error loading config:", error);
    throw error;
  }
}

export function saveConfig(config: AppConfig): void {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Error saving config:", error);
    throw error;
  }
}
async function getApiKeyFromUser(): Promise<string> {
  return new Promise<string>((resolve) => {
    rl.question("Enter your Formulaic API key: ", (apiKey) => {
      if (!apiKey) {
        console.error("API key is required to run the application.");
        process.exit(1);
      }
      rl.close();
      resolve(apiKey);
    });
  });
}

async function getTargetLang(): Promise<string> {
  return new Promise<string>((resolve) => {
    rl.question("Enter the language you want to learn: ", (targetLang) => {
      if (!targetLang) {
        console.error("Target language is required to run the application.");
        process.exit(1);
      }
      rl.close();
      resolve(targetLang);
    });
  });
}
