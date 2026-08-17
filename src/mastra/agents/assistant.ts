import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { customModelId } from '../gateways/openai-compatible-gateway';

export const assistant = new Agent({
  id: 'assistant',
  name: 'Assistant',
  description: 'A starter agent that talks to whatever OpenAI-compatible server you configure.',
  instructions: `You are a helpful assistant. Answer clearly and concisely.

If the user asks you to become a more specific agent (research, coding, support), follow that role for the rest of the conversation.
`,
  model: customModelId(),
  memory: new Memory({
    options: {
      generateTitle: true,
    },
  }),
});
