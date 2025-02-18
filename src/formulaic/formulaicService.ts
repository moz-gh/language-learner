import { FormulaData, Formulaic } from "formulaic-node";
import { CompletionData } from "./types";
import { AppConfig } from "../config/types";

export async function createPhraseFormula(
  apiKey: string,
  config: AppConfig
): Promise<string> {
  const formulaic = new Formulaic(apiKey);
  const newFormula: FormulaData = {
    name: "Language Learning Phrase Generator",
    description:
      "Generates phrases in the target language with highlighted keywords for learning.",
    variables: [
      { name: "userLang", value: config.userLang },
      { name: "targetLang", value: config.targetLang },
      { name: "difficulty", value: "medium" },
      { name: "keyword", value: "" },
    ],
    model: "gpt-4o-mini",
    prompts: [
      {
        text: `Generate a {{{difficulty}}} difficulty phrase in {{{targetLang}}} for a {{{userLang}}} speaker, grounding it in the keyword "{{{keyword}}}".
                Only provide the phrase in the target language {{{targetLang}}}. 
                Only provide plain text, no formatting.`,
      },
    ],
  };
  try {
    const response = await formulaic.createFormula(newFormula);
    return response.id;
  } catch (error) {
    console.error("Error creating formula:", error);
    throw error;
  }
}

export async function getNewPhrase(
  apiKey: string,
  formulaId: string,
  config: AppConfig & { keyword?: string }
): Promise<string | null> {
  const formulaic = new Formulaic(apiKey);
  const completionData: CompletionData = {
    models: ["gpt-4o"],
    variables: [
      { name: "userLang", value: config.userLang },
      { name: "targetLang", value: config.targetLang },
      { name: "difficulty", value: "medium" },
      { name: "keyword", value: config.keyword || "" },
    ],
  };
  try {
    // console.debug('Getting new phrase with data:', completionData);
    const response = await formulaic.createCompletion(
      formulaId,
      completionData
    );
    const messages = response[0].chat.messages;
    const assistantMessages = messages.filter(
      (message: { role: string }) => message.role === "assistant"
    );
    const assistantMessage = assistantMessages[assistantMessages.length - 1];
    return assistantMessage.content;
  } catch (error) {
    console.error("Error fetching new phrase:", error);
    return null;
  }
}

export async function gradeTranslation(
  apiKey: string,
  formulaId: string,
  config: AppConfig & { userInput: string; correctPhrase: string }
): Promise<{ correct: boolean; lesson: string }> {
  const formulaic = new Formulaic(apiKey);
  const completionMessages = [
    {
      role: "system",
      content: `Grade the translation based on the correctness of the translation.
            Do not reply with markdown or other formatting. Only reply in pure JSON.
            The lesson should be informative, and the correctness should be a boolean value.
            The lesson should be a string explaining the translation and any errors made.
            
            Respond with a JSON object containing:
            {
                "correct": boolean,
                "lesson": string
            }`,
    },
    {
      role: "user",
      content: `Grade the translation: "${config.userInput}" for the phrase "${config.correctPhrase}"`,
    },
  ];
  try {
    const response = await formulaic.createChatCompletion(
      formulaId,
      completionMessages
    );
    const content =
      response.chat.messages[response.chat.messages.length - 1].content;
    const grade = JSON.parse(content);
    return grade;
  } catch (error) {
    console.error("Error grading translation:", error);
    throw error;
  }
}

export async function explainPhrase(
  apiKey: string,
  formulaId: string,
  config: AppConfig & { phrase: string }
): Promise<string | null> {
  const formulaic = new Formulaic(apiKey);
  const completionMessages = [
    {
      role: "system",
      content: `Provide a visual explanation of the following phrase by breaking it down word-by-word.
The output should consist of two lines:
  1. The first line is the original phrase with appropriate spacing between words.
  2. The second line contains each word's translation enclosed in pipes, aligned under the corresponding word.
Only provide plain text with no markdown or extra formatting.
For example:
  Input: "Еда это не только"
  Output:
    Еда      это      не        только
    |food|  |is|   |not|    |only|`,
    },
    {
      role: "user",
      content: `Explain the phrase: "${config.phrase}".
The target language is ${config.targetLang} and the user language is ${config.userLang}.`,
    },
  ];
  try {
    const response = await formulaic.createChatCompletion(
      formulaId,
      completionMessages
    );
    const messages = response.chat.messages;
    const assistantMessages = messages.filter(
      (message: { role: string }) => message.role === "assistant"
    );
    const assistantMessage = assistantMessages[assistantMessages.length - 1];
    return assistantMessage.content;
  } catch (error) {
    console.error("Error explaining phrase:", error);
    return null;
  }
}
