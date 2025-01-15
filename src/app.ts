// File Path: /home/gabriel/Code/language-learner/src/app.ts

import { AppController } from './appController';

async function main() {
    const appController = new AppController();

    // Initialize the application
    await appController.initialize();
 
    // Start the lesson cycle
    await appController.startLesson();

    // Example: Finish a lesson with user input
    const userInput = 'user translation attempt'; // Replace with actual user input
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
