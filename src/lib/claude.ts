import Anthropic from '@anthropic-ai/sdk'

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'
export const MAX_TOKENS = 4096