function readAnthropicApiKeyFromEnv(): string | null {
  return process.env.ANTHROPIC_API_KEY?.trim() || null
}

export function getAnthropicApiKey(): string | null {
  return readAnthropicApiKeyFromEnv()
}

export function getAnthropicApiKeyError(): string | null {
  const apiKey = readAnthropicApiKeyFromEnv()

  if (!apiKey) {
    return 'No Anthropic key was found. Set ANTHROPIC_API_KEY with a value starting with sk-ant-.'
  }

  if (!apiKey.startsWith('sk-ant-')) {
    return 'The configured key is not a valid Anthropic key. Use a key that starts with sk-ant-.'
  }

  return null
}
