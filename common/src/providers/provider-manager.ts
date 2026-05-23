/**
 * ProviderManager — Core orchestration layer for multi-provider LLM routing.
 *
 * Manages provider registration, API key resolution, model selection,
 * and configuration persistence. Designed to work both in SDK (local)
 * and server-side contexts.
 */
import fs from 'fs'
import path from 'path'

import {
  PROVIDER_CONFIGS,
  PROVIDER_ENV_VARS,
  PREDEFINED_MODELS,
  parseModelString,
  DEFAULT_AGENT_MODELS,
} from './config'

import type {
  ProviderId,
  ProviderConfig,
  ModelDefinition,
  ProviderRegistration,
  ResolvedModel,
  AgentModelConfig,
  CodebuffConfig,
} from './types'

const CODEBUFF_CONFIG_DIR = '.codebuff'
const CODEBUFF_CONFIG_FILE = 'config.json'

export class ProviderManager {
  private registrations: Map<ProviderId, ProviderRegistration> = new Map()
  private models: Map<ProviderId, ModelDefinition[]> = new Map()
  private agentModels: AgentModelConfig = { ...DEFAULT_AGENT_MODELS }
  private activeModel: ResolvedModel | null = null
  private configPath: string | null = null

  constructor(configDir?: string) {
    this.configPath = configDir
      ? path.join(configDir, CODEBUFF_CONFIG_DIR, CODEBUFF_CONFIG_FILE)
      : null

    // Load predefined models
    for (const model of PREDEFINED_MODELS) {
      const existing = this.models.get(model.provider) ?? []
      existing.push(model)
      this.models.set(model.provider, existing)
    }

    // Auto-register providers from environment variables
    this.registerFromEnv()
  }

  /**
   * Auto-discover and register providers based on available environment variables.
   */
  private registerFromEnv(): void {
    for (const [providerId, providerConfig] of Object.entries(PROVIDER_CONFIGS)) {
      const config = providerConfig as ProviderConfig
      const envVar = config.apiKeyEnvVar

      if (envVar) {
        const apiKey = process.env[envVar]
        if (apiKey) {
          this.register({
            providerId: providerId as ProviderId,
            apiKey,
            baseUrl: process.env[`${providerId.toUpperCase()}_BASE_URL`] ?? config.defaultBaseUrl,
          })
        }
      } else if (providerId === 'ollama') {
        // Ollama doesn't require an API key — auto-register if available
        const baseUrl = process.env.OLLAMA_BASE_URL ?? config.defaultBaseUrl
        this.register({ providerId: 'ollama', baseUrl })
      }
    }
  }

  /**
   * Register a provider with its credentials.
   */
  register(registration: ProviderRegistration): void {
    this.registrations.set(registration.providerId, registration)
  }

  /**
   * Unregister a provider.
   */
  unregister(providerId: ProviderId): void {
    this.registrations.delete(providerId)
  }

  /**
   * Check if a provider is registered and has valid credentials.
   */
  isRegistered(providerId: ProviderId): boolean {
    const reg = this.registrations.get(providerId)
    if (!reg) return false

    const config = PROVIDER_CONFIGS[providerId]
    // Ollama and local providers don't need API keys
    if (config.apiKeyEnvVar === null) return true
    return !!reg.apiKey
  }

  /**
   * Get all currently registered providers.
   */
  getRegisteredProviders(): ProviderRegistration[] {
    return Array.from(this.registrations.values())
  }

  /**
   * Get available providers (both registered and configurable).
   */
  getAvailableProviders(): ProviderConfig[] {
    return Object.values(PROVIDER_CONFIGS)
  }

  /**
   * Get models available for a specific provider.
   * If the provider has predefined models, returns those.
   * Otherwise returns a basic entry.
   */
  getModelsForProvider(providerId: ProviderId): ModelDefinition[] {
    const providerModels = this.models.get(providerId)
    if (providerModels && providerModels.length > 0) {
      return providerModels
    }
    return []
  }

  /**
   * Get all available models across all providers.
   */
  getAllModels(): ModelDefinition[] {
    const all: ModelDefinition[] = []
    for (const models of this.models.values()) {
      all.push(...models)
    }
    return all
  }

  /**
   * Get models for all registered providers.
   */
  getRegisteredModels(): ModelDefinition[] {
    const all: ModelDefinition[] = []
    for (const [providerId] of this.registrations) {
      const models = this.getModelsForProvider(providerId)
      all.push(...models)
    }
    return all
  }

  /**
   * Set the active model to use for requests.
   */
  setActiveModel(modelString: string): ResolvedModel | null {
    const { providerId, modelId } = parseModelString(modelString)
    if (!providerId) return null

    const registration = this.registrations.get(providerId)
    if (!registration) return null

    this.activeModel = {
      providerId,
      modelId,
      providerModelId: modelId,
      apiKey: registration.apiKey,
      baseUrl: registration.baseUrl,
    }
    return this.activeModel
  }

  /**
   * Get the currently active model.
   */
  getActiveModel(): ResolvedModel | null {
    return this.activeModel
  }

  /**
   * Resolve a model string to its full configuration.
   * Falls back to the active model if no model string is provided.
   */
  resolveModel(modelString?: string): ResolvedModel | null {
    if (!modelString) return this.activeModel

    const { providerId, modelId } = parseModelString(modelString)
    if (!providerId) return null

    const registration = this.registrations.get(providerId)
    if (!registration) return null

    return {
      providerId,
      modelId,
      providerModelId: modelId,
      apiKey: registration.apiKey,
      baseUrl: registration.baseUrl,
    }
  }

  /**
   * Get the agent-to-model mapping.
   */
  getAgentModels(): AgentModelConfig {
    return { ...this.agentModels }
  }

  /**
   * Update the agent-to-model mapping.
   */
  setAgentModels(models: Partial<AgentModelConfig>): void {
    Object.assign(this.agentModels, models)
  }

  /**
   * Get a model for a specific agent role.
   */
  getModelForAgent(agent: string): string {
    const key = agent as keyof AgentModelConfig
    return this.agentModels[key] ?? this.agentModels.default
  }

  /**
   * Load configuration from a .codebuff/config.json file.
   */
  loadConfig(configDir: string): boolean {
    const configFilePath = path.join(configDir, CODEBUFF_CONFIG_DIR, CODEBUFF_CONFIG_FILE)
    this.configPath = configFilePath

    try {
      const content = fs.readFileSync(configFilePath, 'utf-8')
      const config: CodebuffConfig = JSON.parse(content)

      // Register providers from config
      if (config.providers) {
        for (const [providerId, providerConfig] of Object.entries(config.providers)) {
          if (providerConfig) {
            const key = providerId as ProviderId
            const existing = this.registrations.get(key)

            this.register({
              providerId: key,
              apiKey: providerConfig.apiKey || existing?.apiKey,
              baseUrl: providerConfig.baseUrl || existing?.baseUrl || PROVIDER_CONFIGS[key]?.defaultBaseUrl,
            })
          }
        }
      }

      // Set agent model mapping
      if (config.models) {
        this.setAgentModels(config.models)
      }

      return true
    } catch {
      // Config file doesn't exist or is invalid — that's fine
      return false
    }
  }

  /**
   * Save the current configuration to .codebuff/config.json.
   */
  saveConfig(configDir: string): boolean {
    const configDirPath = path.join(configDir, CODEBUFF_CONFIG_DIR)
    this.configPath = path.join(configDirPath, CODEBUFF_CONFIG_FILE)

    try {
      fs.mkdirSync(configDirPath, { recursive: true })

      const providers: CodebuffConfig['providers'] = {}
      for (const [providerId, reg] of this.registrations) {
        providers[providerId] = {
          ...(reg.apiKey ? { apiKey: reg.apiKey } : {}),
          ...(reg.baseUrl ? { baseUrl: reg.baseUrl } : {}),
        }
      }

      const config: CodebuffConfig = {
        providers,
        models: this.agentModels,
      }

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8')
      return true
    } catch (error) {
      console.error('Failed to save provider config:', error)
      return false
    }
  }

  /**
   * Connect a provider by reading its API key from a prompt.
   * Used by the /connect CLI command.
   */
  connectProvider(providerId: ProviderId, apiKey: string, baseUrl?: string): boolean {
    const config = PROVIDER_CONFIGS[providerId]
    if (!config) return false

    this.register({
      providerId,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || config.defaultBaseUrl,
    })

    return true
  }

  /**
   * List all available providers with their connection status.
   */
  getProviderStatus(): Array<{
    id: ProviderId
    name: string
    connected: boolean
    modelCount: number
  }> {
    return Object.entries(PROVIDER_CONFIGS).map(([id, config]) => ({
      id: id as ProviderId,
      name: config.name,
      connected: this.isRegistered(id as ProviderId),
      modelCount: this.getModelsForProvider(id as ProviderId).length,
    }))
  }
}

/**
 * Singleton instance for use throughout the application.
 */
let globalProviderManager: ProviderManager | null = null

export function getGlobalProviderManager(): ProviderManager {
  if (!globalProviderManager) {
    globalProviderManager = new ProviderManager()
  }
  return globalProviderManager
}
