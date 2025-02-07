# Language Learner

Language Learner is a CLI-based tool designed to help users learn a new language through interactive phrase translation exercises. It generates learning material using the [Formulaic API](https://formulaic.app) and stores progress locally.

## Features

- Generates language-learning phrases based on a structured formula.
- Grades translations with AI feedback.
- Tracks learned words and progress.
- Supports multiple languages.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- [Node.js](https://nodejs.org) (v16 or later)
- [TypeScript](https://www.typescriptlang.org/) (installed via `npm install -g typescript`)
- A [Formulaic](https://formulaic.app) API key

## Installation

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/language-learner.git
cd language-learner
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Configure the Application

The application requires a Formulaic API key to generate phrases. You will be prompted to enter it on the first run.

Alternatively, you can manually create a config file:

```json
{
  "userLang": "en",
  "targetLang": "es",
  "schedule": 21600000,
  "apiKey": "your-formulaic-api-key",
  "formulaId": "",
  "dataFile": "./data/learned.json"
}
```

Save this file as `data/config.json`.

### 4. Run the Application

```sh
npm run start
```

This will start the language-learning session, prompting you with phrases and grading your translations.

## Usage

### Learning Session

1. The app presents a phrase in the target language.
2. Enter your translation or type `skip` to move on.
3. If correct, you proceed to the next phrase.
4. If incorrect, you receive feedback and another chance to retry.

### Managing Data

All learned data is stored in `data/learned.json`. If needed, you can reset your progress by deleting this file.

## Development

### Running in Development Mode

To run in development mode:

```sh
npm run dev
```

### Running Tests

```sh
npm run test
```

## License

This project is licensed under the Mozilla Public License 2.0 (MPL-2.0). See [LICENSE](LICENSE) for details.
