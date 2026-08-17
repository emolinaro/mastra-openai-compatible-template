# Mastra OpenAI-compatible template

GitHub template for a [Mastra](https://mastra.ai) project that talks to **any OpenAI-compatible `/v1` endpoint**.

Use this when you want agents, workflows, and Studio without depending on OpenAI, Anthropic, or Google as the model host. The gateway works with vLLM, LM Studio, Ollama, llama.cpp, SGLang, hosted proxies, and anything else that implements Chat Completions.

## Use this template

1. Click **Use this template** → **Create a new repository**.
2. Choose an owner, repository name, and visibility.
3. Clone your new repo (not this template):

   ```shell
   git clone git@github.com:<you>/<your-repo>.git
   cd <your-repo>
   ```

Do not fork this repository unless you intend to contribute back. **Use this template** gives you a clean repo with a single initial commit and no extra git history.

## First-time setup

Requires [Node.js 22.13+](https://nodejs.org/).

```shell
cp .env.example .env
npm install
```

Edit `.env`. Use the `/v1` base URL, not `/v1/chat/completions`.

```env
OPENAI_COMPATIBLE_BASE_URL=http://localhost:8000/v1
OPENAI_COMPATIBLE_API_KEY=
OPENAI_COMPATIBLE_MODEL=llama3.2
OPENAI_COMPATIBLE_ID=custom
OPENAI_COMPATIBLE_NAME=OpenAI Compatible
```

`OPENAI_COMPATIBLE_MODEL` must match an `id` from `GET /v1/models`. Leave `OPENAI_COMPATIBLE_API_KEY` empty when the server has no auth.

Confirm the server:

```shell
curl "$OPENAI_COMPATIBLE_BASE_URL/models"
```

Start Studio:

```shell
npm run dev
```

Open [http://localhost:4111](http://localhost:4111), select **Assistant**, and chat.

### Example backends

| Server | Typical base URL | Notes |
| --- | --- | --- |
| [vLLM](https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html) | `http://localhost:8000/v1` | Hugging Face id or `--served-model-name` |
| [LM Studio](https://lmstudio.ai/docs/developer/core/server) | `http://localhost:1234/v1` | Copy the model id from the LM Studio UI |
| [Ollama](https://github.com/ollama/ollama/blob/main/docs/openai.md) | `http://localhost:11434/v1` | Example: `llama3.2` |
| llama.cpp server | `http://localhost:8080/v1` | Alias passed to `--alias` |

## Rename the project

After you create a repo from this template, replace the template name with yours.

1. **npm package name** in `package.json`:

   ```json
   {
     "name": "my-mastra-app"
   }
   ```

   Use lowercase and hyphens, no spaces. Then run `npm install` so `package-lock.json` matches.

2. **Observability label** in `src/mastra/index.ts` (`serviceName`, currently `'mastra'`).

3. **Agent** in `src/mastra/agents/assistant.ts`: change `id`, `name`, and `description` to match the product.

`OPENAI_COMPATIBLE_ID` is only the model prefix (`custom/llama3.2`). It is not the project name.

## How the gateway is wired

1. `src/mastra/gateways/openai-compatible-gateway.ts` implements Mastra's `MastraModelGateway` and calls `/v1/chat/completions`.
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

## Build your Mastra app

This starter is small on purpose. After the endpoint works:

- Rewrite `src/mastra/agents/assistant.ts`
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

## Keep up with the Mastra API

Mastra changes quickly. Do not copy APIs from memory, this template, or an old chat.

**1. Packages.** Update every Mastra package together:

```shell
npm run update:mastra
```

That installs `@mastra/core`, `@mastra/libsql`, `@mastra/memory`, `@mastra/observability`, and `mastra` at `@latest`, then refreshes the bundled Mastra skill.

**2. Skill.** `.agents/skills/mastra` tells coding agents to look up current docs. Refresh it alone with:

```shell
npx skills update mastra
```

If that fails:

```shell
npx skills@latest add mastra-ai/skills
```

**3. Docs for the installed version.** After a bump, treat `node_modules/@mastra/*/dist/docs/` as the source of truth. Use [https://mastra.ai/llms.txt](https://mastra.ai/llms.txt) for guides. Re-check:

- [Custom model gateways](https://mastra.ai/models/gateways/custom-gateways.md)
- [MastraModelGateway](https://mastra.ai/reference/core/mastra-model-gateway.md)

Then compare those pages with `src/mastra/gateways/openai-compatible-gateway.ts`. Drift usually shows up in gateway method signatures, the `@ai-sdk/openai-compatible-v*` import, and `new Mastra({ gateways })`.

For breaking releases, start at the [migration index](https://mastra.ai/reference/migrations/upgrade-to-v1/overview) and run any published codemod (`npx @mastra/codemod@latest`).

## Limits

Mastra's built-in `webSearchTool` is native search for OpenAI, Anthropic, Google, and xAI. It cannot infer a supported provider from a custom OpenAI-compatible model and will fail agent listing. Use `webFetchTool` or a search API (Tavily, Exa, Bright Data) instead.

Thinking models may stream a long reasoning block before the answer. Disable thinking on the server (for example vLLM `chat_template_kwargs.enable_thinking: false`) if you only want the final reply.

## Docs

- [Mastra custom gateways](https://mastra.ai/models/gateways/custom-gateways)
- [Mastra local / custom models](https://mastra.ai/models)
- [Mastra agents](https://mastra.ai/docs/agents/overview)
