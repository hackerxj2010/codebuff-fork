/**
 * Provider types for Codebuff's multi-provider model routing system.
 * Supports Anthropic, OpenAI, Google, Groq, OpenRouter, Ollama, AWS Bedrock, Azure OpenAI.
 */

/**
 * Supported provider identifiers.
 */
export type ProviderId =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'groq'
  | 'openrouter'
  | 'ollama'
  | 'bedrock'
  | 'azure'

/**
 * Named provider configuration.
 */
export interface ProviderConfig {
  id: ProviderId
  name: string
  /** Environment variable name for the API key, or null if not required (e.g., Ollama) */
  apiKeyEnvVar: string | null
  /** Default base URL if applicable */
  defaultBaseUrl?: string
  /** Whether this provider supports vision inputs */
  supportsVision: boolean
  /** Whether this provider supports tool calling */
  supportsToolCalling: boolean
  /** Model prefix used in model strings (e.g., "anthropic/") */
  modelPrefix: string
}

/**
 * Model definition within a provider.
 */
export interface ModelDefinition {
  id: string
  name: string
  provider: ProviderId
  /** Model identifier for API calls */
  apiModelId: string
  contextWindow: number
  supportsVision: boolean
  supportsToolCalling: boolean
  /** Recommended for coding tasks */
  isRecommended?: boolean
}

/**
 * Provider registration with API key and optional base URL.
 */
export interface ProviderRegistration {
  providerId: ProviderId
  apiKey?: string
  baseUrl?: string
}

/**
 * Resolved model after provider and model selection.
 */
export interface ResolvedModel {
  providerId: ProviderId
  modelId: string
  providerModelId: string
  apiKey?: string
  baseUrl?: string
}

/**
 * Mapping from agent roles to model selectors.
 */
export interface AgentModelConfig {
  default: string
  fast?: string
  reasoning?: string
  vision?: string
  filePicker?: string
  planner?: string
  editor?: string
  reviewer?: string
}

/**
 * Complete provider configuration file format (.codebuff/config.json).
 */
export interface CodebuffConfig {
  providers: Partial<Record<ProviderId, { apiKey?: string; baseUrl?: string }>>
  models: AgentModelConfig
  agents?: Partial<Record<string, { model: string }>>
}
