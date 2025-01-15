// src/formulaic/types.ts
export interface Formula {
    id: string;
    name: string;
    description: string;
    variables: Array<{ name: string; value: string; type: string }>;
    model: string;
    prompts: Array<{ text: string }>;
  }
  
  export interface CompletionData {
    models: string[];
    variables: Array<{ name: string; value: string }>;
  }
  