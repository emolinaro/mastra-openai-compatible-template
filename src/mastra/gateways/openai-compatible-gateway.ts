import { createOpenAICompatible } from '@ai-sdk/openai-compatible-v5';
import {
  MastraModelGateway,
  type GatewayAuthResult,
  type GatewayLanguageModel,
  type ProviderConfig,
} from '@mastra/core/llm';

const DEFAULT_ID = 'custom';
const DEFAULT_NAME = 'OpenAI Compatible';
const DEFAULT_BASE_URL = 'http://localhost:8000/v1';
const DEFAULT_MODEL = 'llama3.2';
const NO_AUTH_HEADER = 'x-openai-compatible-no-auth';

export type OpenAICompatibleGatewayOptions = {
  /** Model prefix used in `"id/model"` strings. Defaults to `OPENAI_COMPATIBLE_ID` or `"custom"`. */
  id?: string;
  /** Display name in Studio. */
  name?: string;
  /** OpenAI-compatible base URL, including `/v1`. */
  baseUrl?: string;
  /** Optional bearer token. Empty or omitted means no `Authorization` header. */
  apiKey?: string;
  /** Fallback model ids when `/v1/models` is unreachable. */
  models?: string[];
};

function normalizeBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/**
 * Custom Mastra gateway for any server that exposes an OpenAI-compatible API.
 *
 * Works with vLLM, LM Studio, Ollama, llama.cpp, SGLang, TensorRT-LLM, and
 * hosted OpenAI-compatible proxies. Model IDs are `"<id>/<served-model-name>"`.
 */
export class OpenAICompatibleGateway extends MastraModelGateway {
  readonly id: string;
  readonly name: string;
  private readonly options: OpenAICompatibleGatewayOptions;

  constructor(options: OpenAICompatibleGatewayOptions = {}) {
    super();
    this.options = options;
    this.id = options.id ?? readEnv('OPENAI_COMPATIBLE_ID') ?? DEFAULT_ID;
    this.name = options.name ?? readEnv('OPENAI_COMPATIBLE_NAME') ?? DEFAULT_NAME;
  }

  buildUrl(_modelId?: string, envVars?: Record<string, string>): string {
    const baseUrl =
      this.options.baseUrl ||
      envVars?.OPENAI_COMPATIBLE_BASE_URL ||
      process.env.OPENAI_COMPATIBLE_BASE_URL ||
      DEFAULT_BASE_URL;
    return normalizeBaseUrl(baseUrl);
  }

  async getApiKey(_modelId: string): Promise<string> {
    return this.readApiKey() ?? '';
  }

  async resolveAuth(): Promise<GatewayAuthResult> {
    const apiKey = this.readApiKey();
    if (apiKey) {
      return { apiKey, source: 'gateway' };
    }

    // Empty keys are valid for local servers. A header (not a fake Bearer token)
    // lets Mastra treat the gateway as authenticated without sending Authorization.
    return {
      source: 'gateway',
      headers: { [NO_AUTH_HEADER]: '1' },
    };
  }

  async fetchProviders(): Promise<Record<string, ProviderConfig>> {
    const models = await this.listServedModels();

    return {
      [this.id]: {
        name: this.name,
        models,
        apiKeyEnvVar: this.readApiKey() ? 'OPENAI_COMPATIBLE_API_KEY' : [],
        gateway: this.id,
        url: this.buildUrl(),
        docUrl: 'https://mastra.ai/models/gateways/custom-gateways',
      },
    };
  }

  async resolveLanguageModel({
    modelId,
    providerId,
    apiKey,
    headers,
  }: {
    modelId: string;
    providerId: string;
    apiKey: string;
    headers?: Record<string, string>;
  }): Promise<GatewayLanguageModel> {
    const servedModelName = this.toServedModelName(providerId, modelId);
    const resolvedKey = apiKey?.trim();
    const { [NO_AUTH_HEADER]: _ignored, ...requestHeaders } = headers ?? {};

    return createOpenAICompatible({
      name: this.id,
      ...(resolvedKey ? { apiKey: resolvedKey } : {}),
      baseURL: this.buildUrl(),
      headers: Object.keys(requestHeaders).length > 0 ? requestHeaders : undefined,
      supportsStructuredOutputs: true,
    }).chatModel(servedModelName);
  }

  /**
   * Two-part IDs like `custom/llama3.2` resolve with this gateway's id.
   * Hugging Face names parsed as `custom/Qwen/Qwen2.5-7B-Instruct` are rejoined.
   */
  private toServedModelName(providerId: string, modelId: string): string {
    if (providerId === this.id) {
      return modelId;
    }

    return `${providerId}/${modelId}`;
  }

  private readApiKey(): string | undefined {
    return this.options.apiKey?.trim() || readEnv('OPENAI_COMPATIBLE_API_KEY');
  }

  private async listServedModels(): Promise<string[]> {
    const configured = this.options.models ?? [];
    const envModel = readEnv('OPENAI_COMPATIBLE_MODEL');
    const models = new Set<string>(configured);

    if (envModel) {
      models.add(envModel);
    }

    try {
      const apiKey = this.readApiKey();
      const response = await fetch(`${this.buildUrl()}/models`, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      });

      if (response.ok) {
        const body = (await response.json()) as { data?: Array<{ id?: string }> };
        for (const model of body.data ?? []) {
          if (model.id) {
            models.add(model.id);
          }
        }
      }
    } catch {
      // The server may not be running during type generation or startup.
    }

    if (models.size === 0) {
      models.add(DEFAULT_MODEL);
    }

    return [...models];
  }
}

export const openaiCompatibleGateway = new OpenAICompatibleGateway();

export function customModelId(
  servedModelName = readEnv('OPENAI_COMPATIBLE_MODEL') ?? DEFAULT_MODEL,
  gatewayId = readEnv('OPENAI_COMPATIBLE_ID') ?? DEFAULT_ID,
) {
  return `${gatewayId}/${servedModelName}` as const;
}
