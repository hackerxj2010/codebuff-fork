/**
 * Default provider and model configurations for Codebuff's multi-provider system.
 * Maps to environment variable names and default model IDs.
 */
import type { ProviderConfig, ModelDefinition, ProviderId } from './types'

/**
 * Predefined provider configurations.
 * Each provider maps to environment variable names and has sensible defaults.
 */
export const PROVIDER_CONFIGS: Record<ProviderId, ProviderConfig> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    supportsVision: true,
    supportsToolCalling: true,
    modelPrefix: 'anthropic/',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (GPT)',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    supportsVision: true,
    supportsToolCalling: true,
    modelPrefix: 'openai/',
  },
  google: {
    id: 'google',
    name: 'Google (Gemini)',
    apiKeyEnvVar: 'GOOGLE_API_KEY',
    supportsVision: true,
    supportsToolCalling: true,
    modelPrefix: 'google/',
  },
  groq: {
    id: 'groq',
    name: 'Groq (Ultra-fast)',
    apiKeyEnvVar: 'GROQ_API_KEY',
    supportsVision: false,
    supportsToolCalling: true,
    modelPrefix: 'groq/',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (75+ models)',
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    supportsVision: true,
    supportsToolCalling: true,
    modelPrefix: 'openrouter/',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    apiKeyEnvVar: null,
    defaultBaseUrl: 'http://localhost:11434/v1',
    supportsVision: true,
    supportsToolCalling: true,
    modelPrefix: 'ollama/',
  },
  bedrock: {
    id: 'bedrock',
    name: 'AWS Bedrock',
    apiKeyEnvVar: 'AWS_ACCESS_KEY_ID',
    supportsVision: true,
    supportsToolCalling: true,
    modelPrefix: 'bedrock/',
  },
  azure: {
    id: 'azure',
    name: 'Azure OpenAI',
    apiKeyEnvVar: 'AZURE_OPENAI_API_KEY',
    defaultBaseUrl: 'https://YOUR_RESOURCE.openai.azure.com',
    supportsVision: true,
    supportsToolCalling: true,
    modelPrefix: 'azure/',
  },
}

/**
 * Predefined model definitions for popular models across providers.
 */
export const PREDEFINED_MODELS: ModelDefinition[] = [
  // Anthropic
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', provider: 'anthropic', apiModelId: 'claude-opus-4-20250514', contextWindow: 200000, supportsVision: true, supportsToolCalling: true, isRecommended: true },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'anthropic', apiModelId: 'claude-sonnet-4-20250514', contextWindow: 200000, supportsVision: true, supportsToolCalling: true, isRecommended: true },
  { id: 'anthropic/claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'anthropic', apiModelId: 'claude-haiku-4-5-20251001', contextWindow: 200000, supportsVision: true, supportsToolCalling: true },

  // OpenAI
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai', apiModelId: 'gpt-4o', contextWindow: 128000, supportsVision: true, supportsToolCalling: true, isRecommended: true },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', apiModelId: 'gpt-4o-mini', contextWindow: 128000, supportsVision: true, supportsToolCalling: true },
  { id: 'openai/o3-mini', name: 'o3-mini', provider: 'openai', apiModelId: 'o3-mini', contextWindow: 200000, supportsVision: false, supportsToolCalling: true, isRecommended: true },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'openai', apiModelId: 'gpt-4.1', contextWindow: 1000000, supportsVision: true, supportsToolCalling: true },

  // Google
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', apiModelId: 'gemini-2.5-pro-exp-03-25', contextWindow: 1000000, supportsVision: true, supportsToolCalling: true, isRecommended: true },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', apiModelId: 'gemini-2.5-flash-001', contextWindow: 1000000, supportsVision: true, supportsToolCalling: true },
  { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', apiModelId: 'gemini-2.0-flash', contextWindow: 1000000, supportsVision: true, supportsToolCalling: true },

  // Groq
  { id: 'groq/llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'groq', apiModelId: 'llama-3.3-70b-versatile', contextWindow: 128000, supportsVision: false, supportsToolCalling: true, isRecommended: true },
  { id: 'groq/deepseek-r1-distill', name: 'DeepSeek R1 Distill', provider: 'groq', apiModelId: 'deepseek-r1-distill-llama-70b', contextWindow: 128000, supportsVision: false, supportsToolCalling: true },
  { id: 'groq/qwen-qwq-32b', name: 'QwQ 32B', provider: 'groq', apiModelId: 'qwen-qwq-32b', contextWindow: 128000, supportsVision: false, supportsToolCalling: true },

  // OpenRouter
  { id: 'openrouter/deepseek-r1', name: 'DeepSeek R1', provider: 'openrouter', apiModelId: 'deepseek/deepseek-r1', contextWindow: 128000, supportsVision: false, supportsToolCalling: true, isRecommended: true },
  { id: 'openrouter/qwen-3-coder', name: 'Qwen 3 Coder', provider: 'openrouter', apiModelId: 'qwen/qwen3-coder', contextWindow: 128000, supportsVision: false, supportsToolCalling: true },
  { id: 'openrouter/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'openrouter', apiModelId: 'meta-llama/llama-4-maverick', contextWindow: 1000000, supportsVision: true, supportsToolCalling: true },

  // Ollama
  { id: 'ollama/qwen2.5-coder-14b', name: 'Qwen 2.5 Coder 14B', provider: 'ollama', apiModelId: 'qwen2.5-coder:14b', contextWindow: 32768, supportsVision: false, supportsToolCalling: true, isRecommended: true },
  { id: 'ollama/llama-3.2-3b', name: 'Llama 3.2 3B', provider: 'ollama', apiModelId: 'llama3.2:3b', contextWindow: 128000, supportsVision: false, supportsToolCalling: true },
  { id: 'ollama/deepseek-coder-v2', name: 'DeepSeek Coder V2', provider: 'ollama', apiModelId: 'deepseek-coder-v2', contextWindow: 128000, supportsVision: false, supportsToolCalling: true },

  // AWS Bedrock
  { id: 'bedrock/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'bedrock', apiModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0', contextWindow: 200000, supportsVision: true, supportsToolCalling: true, isRecommended: true },
]

/**
 * Default agent-to-model mapping.
 */
export const DEFAULT_AGENT_MODELS = {
  default: 'anthropic/claude-sonnet-4',
  fast: 'groq/llama-3.3-70b',
  reasoning: 'openai/o3-mini',
  vision: 'anthropic/claude-sonnet-4',
  filePicker: 'groq/llama-3.3-70b',
  planner: 'openai/o3-mini',
  editor: 'anthropic/claude-sonnet-4',
  reviewer: 'anthropic/claude-sonnet-4',
} as const

/**
 * Environment variable names for each provider's API key.
 */
export const PROVIDER_ENV_VARS: Record<ProviderId, string | null> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_API_KEY',
  groq: 'GROQ_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  ollama: null,
  bedrock: 'AWS_ACCESS_KEY_ID',
  azure: 'AZURE_OPENAI_API_KEY',
} as const

/**
 * Parse a model string like "anthropic/claude-sonnet-4" into provider and model parts.
 */
export function parseModelString(modelString: string): { providerId: ProviderId | null; modelId: string } {
  for (const [providerId, config] of Object.entries(PROVIDER_CONFIGS)) {
    if (modelString.startsWith(config.modelPrefix)) {
      const modelId = modelString.slice(config.modelPrefix.length)
      return { providerId: providerId as ProviderId, modelId }
    }
  }

  // No prefix found — assume it's an Anthropic model (legacy behavior)
  return { providerId: 'anthropic', modelId: modelString }
}

/**
 * Format a provider and model ID into a full model string.
 */
export function formatModelString(providerId: ProviderId, modelId: string): string {
  return `${providerId}/${modelId}`
}
