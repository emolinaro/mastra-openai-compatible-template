# AGENTS.md

## CRITICAL: Load `mastra` skill first

Load the `mastra` skill BEFORE any Mastra work. Never rely on cached knowledge — APIs change between versions.

## Rules

- Register all agents, tools, workflows, and scorers in `src/mastra/index.ts`
- Register custom model gateways in `src/mastra/index.ts` under `gateways`
- Use the `dev` and `build` scripts from `package.json` instead of running `mastra dev` / `mastra build` directly
- Point agents at the custom endpoint with `customModelId()` or `"<OPENAI_COMPATIBLE_ID>/<served-model-name>"`
- Do not use Mastra's built-in `webSearchTool` with custom OpenAI-compatible servers. It only works with OpenAI, Anthropic, Google, and xAI native search. Use `webFetchTool` or a third-party search API instead.
- Never add `Co-authored-by` trailers for Cursor, coding agents, or bots. Agents must not appear as GitHub contributors.

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- [Custom model gateways](https://mastra.ai/models/gateways/custom-gateways)
- [Local and custom OpenAI-compatible models](https://mastra.ai/models)
