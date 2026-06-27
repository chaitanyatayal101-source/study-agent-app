import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

import { getGroqApiKey } from '@/lib/ai-config'

export async function POST(request: Request) {
  const body = await request.json()
  const userMessage = typeof body?.userMessage === 'string' ? body.userMessage : ''

  const prompt = `You are a concept extraction assistant. Given a user's message, extract the study subject and the specific concept being discussed.
If the message is not about studying a concept, return an empty subject and concept.
Return only valid JSON in this exact shape:
{"subject":"","concept":""}

Message:
${userMessage}`

  const apiKey = getGroqApiKey()

  if (!apiKey) {
    return NextResponse.json({ subject: '', concept: '' })
  }

  try {
    const result = await generateText({
      model: createGroq({ apiKey })('llama-3.3-70b-versatile'),
      prompt,
    })

    let parsed: { subject?: string; concept?: string } = {}

    try {
      parsed = JSON.parse(result.text)
    } catch {
      parsed = {}
    }

    return NextResponse.json({
      subject: typeof parsed.subject === 'string' ? parsed.subject : '',
      concept: typeof parsed.concept === 'string' ? parsed.concept : '',
    })
  } catch {
    return NextResponse.json({ subject: '', concept: '' })
  }
}
