import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, MastraStorageExporter, SensitiveDataFilter } from '@mastra/observability';
import { assistant } from './agents/assistant';
import { openaiCompatibleGateway } from './gateways/openai-compatible-gateway';

export const mastra = new Mastra({
  gateways: {
    custom: openaiCompatibleGateway,
  },
  agents: { assistant },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: 'file:./mastra.db',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [new MastraStorageExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
