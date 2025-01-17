export interface Formula {
  name: string;
  description: string;
  variables: Array<{ name: string; value: string }>;
  model: string;
  prompts: Array<{ text: string }>;
}

export interface CompletionData {
  models: string[];
  variables: Array<{ name: string; value: string }>;
}
