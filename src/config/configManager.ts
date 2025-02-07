import fs from 'fs';
import path from 'path';
import os from 'os';
import { AppConfig } from './types';

// Use a writable directory outside the snapshot
const dataDir = path.join(os.homedir(), '.language-learner');
const configPath = path.join(dataDir, 'config.json');

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const defaultConfig: AppConfig = {
    userLang: 'en',
    targetLang: 'es',
    schedule: 21600000, // 6 hours in milliseconds
    apiKey: '',
    formulaId: '',
    dataFile: path.join(dataDir, 'learned.json'),
};

export async function loadConfig(): Promise<AppConfig> {
    try {
        let config: AppConfig;

        if (!fs.existsSync(configPath)) {
            console.warn('Config file not found. Creating with default values...');
            config = { ...defaultConfig };
        } else {
            const data = fs.readFileSync(configPath, 'utf-8');
            config = JSON.parse(data) as AppConfig;
        }

        if (!config.apiKey) {
            console.warn('API key not found in config. Prompting user for input...');
            config.apiKey = await getApiKeyFromUser();
            saveConfig(config);
        }

        return config;
    } catch (error) {
        console.error('Error loading config:', error);
        throw error;
    }
}

export function saveConfig(config: AppConfig): void {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving config:', error);
        throw error;
    }
}

async function getApiKeyFromUser(): Promise<string> {
    return new Promise<string>((resolve) => {
        process.stdout.write('Enter your Formulaic API key: ');
        process.stdin.once('data', (data) => {
            const apiKey = data.toString().trim();
            if (!apiKey) {
                console.error('API key is required to run the application.');
                process.exit(1);
            }
            resolve(apiKey);
        });
    });
}
