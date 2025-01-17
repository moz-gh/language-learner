
import { AppController } from './appController';

async function main() {
    const appController = new AppController();

    // Initialize the application
    await appController.initialize();

    // Start the main learning loop
    await appController.mainLoop();
}

main().catch((error) => {
    console.error('An error occurred during application execution:', error);
});