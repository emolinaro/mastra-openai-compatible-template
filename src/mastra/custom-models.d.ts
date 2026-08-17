import '@mastra/core/llm';

declare module '@mastra/core/llm' {
  interface ProviderModelsMap {
    custom: readonly ['llama3.2'];
  }
}
