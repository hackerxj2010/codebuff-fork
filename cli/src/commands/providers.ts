/**
 * Provider management CLI commands.
 * /connect — Register a new LLM provider
 * /models — List and switch active models
 */

import { ProviderManager, PROVIDER_CONFIGS, parseModelString, PREDEFINED_MODELS } from '@codebuff/common/providers'
import { getSystemMessage, getUserMessage } from '../utils/message-history'

import type { RouterParams, CommandResult } from './command-registry'
import type { ProviderId } from '@codebuff/common/providers'
import type { ChatMessage } from '../types/chat'

/**
 * Build a rich markdown table of provider status.
 */
function buildProviderStatusTable(manager: ProviderManager): string {
  const providers = manager.getProviderStatus()

  const tableHeader = '| Provider | Status | Models |\n|----------|--------|--------|\n'
  const tableRows = providers
    .filter((p) => p.modelCount > 0) // Only show providers that have models defined
    .map((p) => {
      const status = p.connected ? '✅ Connected' : '❌ Not connected'
      const modelCount = `${p.modelCount} model${p.modelCount !== 1 ? 's' : ''}`
      return `| ${p.name} | ${status} | ${modelCount} |`
    })
    .join('\n')

  return tableHeader + tableRows
}

/**
 * Build a markdown table of available models for a provider.
 */
function buildModelListTable(manager: ProviderManager, providerId?: ProviderId): string {
  const models = providerId
    ? manager.getModelsForProvider(providerId)
    : manager.getRegisteredModels()

  if (models.length === 0) {
    return 'No models available.'
  }

  const activeModel = manager.getActiveModel()

  const tableHeader = '| Model | Name | Context | Recommended |\n|-------|------|---------|-------------|\n'
  const tableRows = models.map((m) => {
    const isActive = activeModel?.modelId === m.id || activeModel?.modelId === m.apiModelId
    const prefix = isActive ? '→ ' : '  '
    const ctx = m.contextWindow >= 1000000
      ? `${(m.contextWindow / 1000000).toFixed(0)}M`
      : m.contextWindow >= 1000
        ? `${(m.contextWindow / 1000).toFixed(0)}K`
        : `${m.contextWindow}`
    const recommended = m.isRecommended ? '⭐' : ''
    return `${prefix}| \`${m.id}\` | ${m.name} | ${ctx} | ${recommended} |`
  })

  return tableHeader + tableRows.join('\n')
}

/**
 * /connect command handler.
 * Connect to a specific LLM provider.
 *
 * Usage:
 *   /connect              — Show connection status and available providers
 *   /connect <provider>   — Connect to a specific provider
 *   /connect <provider> <apiKey> — Connect with explicit API key
 */
export function handleConnectCommand(
  params: RouterParams,
  args: string,
): CommandResult {
  const projectRoot = process.cwd()
  const manager = new ProviderManager(projectRoot)
  manager.loadConfig(projectRoot)

  const trimmedArgs = args.trim()

  if (!trimmedArgs) {
    // Show connection status
    const statusTable = buildProviderStatusTable(manager)
    const helpText = [
      '## Provider Connection Status',
      '',
      statusTable,
      '',
      '**Usage:**',
      '  `/connect <provider>`           — Connect a provider (will prompt for API key)',
      '  `/connect <provider> <key>`     — Connect with an explicit API key',
      '  `/connect status`               — Show connection status',
      '',
      '**Available providers:**',
      ...Object.entries(PROVIDER_CONFIGS).map(
        ([id, config]) => `  \`${id}\` — ${config.name}${config.apiKeyEnvVar ? ` (env: \`${config.apiKeyEnvVar}\`)` : ' (no API key required)'}`,
      ),
    ].join('\n')

    params.setMessages((prev: ChatMessage[]) => [
      ...prev,
      getUserMessage(params.inputValue.trim()),
      getSystemMessage(helpText),
    ])
    params.saveToHistory(params.inputValue.trim())
    return
  }

  // Parse provider ID
  const lowerArgs = trimmedArgs.toLowerCase()

  if (lowerArgs === 'status') {
    const statusTable = buildProviderStatusTable(manager)
    params.setMessages((prev: ChatMessage[]) => [
      ...prev,
      getUserMessage(params.inputValue.trim()),
      getSystemMessage(`## Provider Connection Status\n\n${statusTable}`),
    ])
    params.saveToHistory(params.inputValue.trim())
    return
  }

  // Check if the arg matches a provider ID
  const providerConfig = PROVIDER_CONFIGS[lowerArgs as ProviderId]
  if (!providerConfig) {
    params.setMessages((prev: ChatMessage[]) => [
      ...prev,
      getUserMessage(params.inputValue.trim()),
      getSystemMessage(
        `Unknown provider: \`${lowerArgs}\`. Available providers: ${Object.keys(PROVIDER_CONFIGS).join(', ')}`,
      ),
    ])
    params.saveToHistory(params.inputValue.trim())
    return
  }

  // If args only has provider ID, show instructions for getting API key
  params.setMessages((prev: ChatMessage[]) => [
    ...prev,
    getUserMessage(params.inputValue.trim()),
    getSystemMessage(
      `## ${providerConfig.name}\n\n`
      + `To connect **${providerConfig.name}**:\n\n`
      + `${providerConfig.apiKeyEnvVar ? `1. Get your API key from the [${providerConfig.name} console](${getProviderUrl(providerConfig.id)})\n2. Run: \`/connect ${providerConfig.id} <your-api-key>\`\n3. Or set the \`${providerConfig.apiKeyEnvVar}\` environment variable and restart Codebuff` : 'No API key required! The provider works out of the box.'}\n\n`
      + `**Default model:** \`${providerConfig.id}/${getDefaultModelForProvider(providerConfig.id)}\``,
    ),
  ])
  params.saveToHistory(params.inputValue.trim())

  // If this is ollama (no API key), connect immediately
  if (!providerConfig.apiKeyEnvVar) {
    manager.connectProvider(providerConfig.id, '', providerConfig.defaultBaseUrl)
    manager.saveConfig(process.cwd())
    params.setMessages((prev: ChatMessage[]) => [
      ...prev,
      getSystemMessage(`✅ Connected to **${providerConfig.name}**!`),
    ])
  }

  return
}

/**
 * /models command handler.
 * List and switch between available models.
 *
 * Usage:
 *   /models              — List all available models from connected providers
 *   /models <model-id>   — Switch to a specific model (e.g., "anthropic/claude-sonnet-4")
 */
export function handleModelsCommand(
  params: RouterParams,
  args: string,
): CommandResult {
  const projectRoot = process.cwd()
  const manager = new ProviderManager(projectRoot)
  manager.loadConfig(projectRoot)

  const trimmedArgs = args.trim()

  if (!trimmedArgs) {
    // Show models from connected providers
    const registeredModels = manager.getRegisteredModels()

    if (registeredModels.length === 0) {
      params.setMessages((prev: ChatMessage[]) => [
        ...prev,
        getUserMessage(params.inputValue.trim()),
        getSystemMessage(
          '## Models\n\n'
          + 'No providers are currently connected. Use `/connect` to connect a provider first.\n\n'
          + '**Example:**\n'
          + '  `/connect anthropic sk-ant-...` — Connect Anthropic\n'
          + '  `/connect openrouter sk-or-...` — Connect OpenRouter (75+ models)\n'
          + '  `/models anthropic/claude-sonnet-4` — Use Claude Sonnet 4',
        ),
      ])
      params.saveToHistory(params.inputValue.trim())
      return
    }

    const activeModel = manager.getActiveModel()
    const activeStr = activeModel
      ? `\n\n**Active model:** \`${activeModel.providerId}/${activeModel.modelId}\``
      : ''

    const modelsByProvider = new Map<string, typeof registeredModels>()
    for (const model of registeredModels) {
      const existing = modelsByProvider.get(model.provider) ?? []
      existing.push(model)
      modelsByProvider.set(model.provider, existing)
    }

    let modelList = ''
    for (const [providerId, models] of modelsByProvider) {
      const config = PROVIDER_CONFIGS[providerId as ProviderId]
      modelList += `\n### ${config?.name ?? providerId}\n\n`
      modelList += models.map((m) => {
        const isActive = activeModel?.modelId === m.id
        return `${isActive ? '→ ' : '  '}\`${m.id}\` — ${m.name}${m.isRecommended ? ' ⭐' : ''}`
      }).join('\n')
      modelList += '\n'
    }

    params.setMessages((prev: ChatMessage[]) => [
      ...prev,
      getUserMessage(params.inputValue.trim()),
      getSystemMessage(
        `## Available Models\n${activeStr}\n\n`
        + modelList
        + '\n**Switch model:** `/models <model-id>`\n'
        + '**Example:** `/models anthropic/claude-sonnet-4`',
      ),
    ])
    params.saveToHistory(params.inputValue.trim())
    return
  }

  // Try to set the active model
  const resolved = manager.resolveModel(trimmedArgs)
  if (!resolved) {
    const { providerId, modelId } = parseModelString(trimmedArgs)
    const suggestion = providerId
      ? `Provider \`${providerId}\` is not connected. Use \`/connect ${providerId}\` first.`
      : 'Unknown model format. Use `provider/model-id` format, e.g., `anthropic/claude-sonnet-4`'

    params.setMessages((prev: ChatMessage[]) => [
      ...prev,
      getUserMessage(params.inputValue.trim()),
      getSystemMessage(`❌ ${suggestion}`),
    ])
    params.saveToHistory(params.inputValue.trim())
    return
  }

  manager.setActiveModel(trimmedArgs)
  manager.saveConfig(process.cwd())

  const config = PROVIDER_CONFIGS[resolved.providerId]
  params.setMessages((prev: ChatMessage[]) => [
    ...prev,
    getUserMessage(params.inputValue.trim()),
    getSystemMessage(
      `✅ Active model switched to **\`${trimmedArgs}\`** (${config?.name ?? resolved.providerId})`,
    ),
  ])
  params.saveToHistory(params.inputValue.trim())
  return
}

/**
 * Get a helper URL for the provider's API key page.
 */
function getProviderUrl(providerId: ProviderId): string {
  const urls: Partial<Record<ProviderId, string>> = {
    anthropic: 'https://console.anthropic.com/',
    openai: 'https://platform.openai.com/api-keys',
    google: 'https://aistudio.google.com/apikey',
    groq: 'https://console.groq.com/keys',
    openrouter: 'https://openrouter.ai/keys',
    bedrock: 'https://aws.amazon.com/bedrock/',
    azure: 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/OpenAI',
  }
  return urls[providerId] ?? '#'
}

/**
 * Get the default model ID for a provider.
 */
function getDefaultModelForProvider(providerId: ProviderId): string {
  const defaultModels: Partial<Record<ProviderId, string>> = {
    anthropic: 'claude-sonnet-4',
    openai: 'gpt-4o',
    google: 'gemini-2.5-pro',
    groq: 'llama-3.3-70b',
    openrouter: 'deepseek-r1',
    ollama: 'qwen2.5-coder-14b',
    bedrock: 'claude-3.5-sonnet',
    azure: 'gpt-4o',
  }
  return defaultModels[providerId] ?? 'claude-sonnet-4'
}
