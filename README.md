# Mastra OpenAI-compatible template

Clone this repository, point it at any server that speaks the OpenAI Chat Completions API, and build a Mastra project on top of it.

The gateway does not care whether the backend is vLLM, LM Studio, Ollama, llama.cpp, SGLang, or a hosted proxy. It only needs:

- a base URL that ends in `/v1`
- a model id the server advertises on `GET /v1/models`
- an API key only if the server requires one

## Quick start

```shell
git clone <this-repo-url> my-mastra-app
cd my-mastra-app
cp .env.example .env
npm install
```

Edit `.env`:

```env
OPENAI_COMPATIBLE_BASE_URL=http://localhost:8000/v1
OPENAI_COMPATIBLE_API_KEY=
OPENAI_COMPATIBLE_MODEL=llama3.2
OPENAI_COMPATIBLE_ID=custom
```

Start the OpenAI-compatible server, then:

```shell
npm run dev
```

Open [http://localhost:4111](http://localhost:4111), select **Assistant**, and chat.

Use the `/v1` base URL, not `/v1/chat/completions`. Confirm the server is up with:

```shell
curl "$OPENAI_COMPATIBLE_BASE_URL/models"
```

`OPENAI_COMPATIBLE_MODEL` must match an `id` from that response.

## Backend examples

| Server | Typical base URL | Notes |
| --- | --- | --- |
| [vLLM](https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html) | `http://localhost:8000/v1` | Model id is the Hugging Face id or `--served-model-name` |
| [LM Studio](https://lmstudio.ai/docs/developer/core/server) | `http://localhost:1234/v1` | Copy the model id from the LM Studio UI |
| [Ollama](https://github.com/ollama/ollama/blob/main/docs/openai.md) | `http://localhost:11434/v1` | Example model: `llama3.2` |
| llama.cpp server | `http://localhost:8080/v1` | Use the alias passed to `--alias` |

Leave `OPENAI_COMPATIBLE_API_KEY` empty when the server has no auth. If the server was started with `--api-key` (or equivalent), set the same value.

## How the gateway is wired

1. `src/mastra/gateways/openai-compatible-gateway.ts` implements Mastra's `MastraModelGateway` and talks to `/v1/chat/completions`.
2. `src/mastra/index.ts` registers it:

   ```ts
   gateways: {
     custom: openaiCompatibleGateway,
   }
   ```

3. Agents select a model with the gateway prefix:

   ```ts
   model: customModelId()
   // or: model: 'custom/llama3.2'
   // Hugging Face ids: 'custom/Qwen/Qwen2.5-7B-Instruct'
   ```

## Make it your project

This starter is intentionally small. After it runs against your endpoint:

- Rename the agent and rewrite `src/mastra/agents/assistant.ts`
- Add tools, workflows, memory, and scorers, then register them in `src/mastra/index.ts`
- Add more gateways if you run several servers:

  ```ts
  import { OpenAICompatibleGateway } from './gateways/openai-compatible-gateway';

  export const mastra = new Mastra({
    gateways: {
      vllm: new OpenAICompatibleGateway({
        id: 'vllm',
        name: 'vLLM',
        baseUrl: 'http://localhost:8000/v1',
      }),
      lmstudio: new OpenAICompatibleGateway({
        id: 'lmstudio',
        name: 'LM Studio',
        baseUrl: 'http://localhost:1234/v1',
      }),
    },
  });
  ```

  Then use `model: 'vllm/Qwen/Qwen2.5-7B-Instruct'` or `model: 'lmstudio/qwen/qwen3-30b-a3b-2507'`.

## Limits

Mastra's built-in `webSearchTool` is provider-native search for OpenAI, Anthropic, Google, and xAI. It cannot infer a supported provider from a custom OpenAI-compatible model and will fail agent listing. Use `webFetchTool` or a search API (Tavily, Exa, Bright Data) instead.

Thinking models may stream a long reasoning block before the answer. Disable thinking in the server (for example vLLM `chat_template_kwargs.enable_thinking: false`) if you only want the final reply.

## Docs

- [Mastra custom gateways](https://mastra.ai/models/gateways/custom-gateways)
- [Mastra local / custom models](https://mastra.ai/models)
- [Mastra agents](https://mastra.ai/docs/agents/overview)
