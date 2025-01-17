// File Path: /home/gabriel/Code/language-learner/src/app.ts

import { AppController } from './appController';
import readline from 'readline';

async function main() {
    const appController = new AppController();

    // Initialize the application
    await appController.initialize();

    // Start the lesson cycle
    await appController.startLesson();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (text: string) => {
        return new Promise<string>((resolve) => {
            rl.question(text, (answer) => {
                resolve(answer);
            });
        });
    };

    const userInput = await question('Please enter your translation attempt: ');
    appController.finishLesson(userInput);
    rl.close();
    appController.finishLesson(userInput);

    // Schedule the lesson cycle based on the configured interval
    setInterval(async () => {
        await appController.startLesson();
        // Handle user input and finish lesson as needed
    }, appController.getConfig().schedule);
}

main().catch((error) => {
    console.error('An error occurred during application execution:', error);
});
