function readGroqApiKeyFromEnv(): string | null {
  return process.env.GROQ_API_KEY?.trim() || null
}

export function getGroqApiKey(): string | null {
  return readGroqApiKeyFromEnv()
}

export function getGroqApiKeyError(): string | null {
  const apiKey = readGroqApiKeyFromEnv()

  if (!apiKey) {
    return 'No Groq key was found. Set GROQ_API_KEY with a value starting with gsk_.'
  }

  if (!apiKey.startsWith('gsk_')) {
    return 'The configured key is not a valid Groq key. Use a key that starts with gsk_.'
  }

  return null
}
