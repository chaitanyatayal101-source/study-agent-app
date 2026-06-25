import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { NextResponse } from 'next/server'

import { getAnthropicApiKey, getAnthropicApiKeyError } from '@/lib/ai-config'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const userMessage = typeof body?.userMessage === 'string' ? body.userMessage : ''
  const subject = typeof body?.subject === 'string' ? body.subject : ''
  const concept = typeof body?.concept === 'string' ? body.concept : ''

  let systemPrompt = `You are a study tutor. Respond in a clear, supportive way. Keep the explanation concise but helpful.`

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (subject && concept && user?.id) {
    const { data, error } = await supabase
      .from('concepts')
      .select('*')
      .eq('user_id', user.id)
      .eq('subject', subject)
      .eq('concept', concept)
      .maybeSingle()

    if (!error && data) {
      const { mastery_level, weak_areas, strong_areas } = data as {
        mastery_level?: string | null
        weak_areas?: string[] | null
        strong_areas?: string[] | null
      }

      const weakAreasText = weak_areas?.length ? weak_areas.join(', ') : 'none listed'
      const strongAreasText = strong_areas?.length ? strong_areas.join(', ') : 'none listed'

      if (!mastery_level || mastery_level === 'Introduced' || mastery_level === 'Developing') {
        systemPrompt = `You are a study tutor for ${subject}. Use Mode B: reference prior knowledge, mention weak areas, and maintain a moderate pace. The learner is currently at mastery level ${mastery_level ?? 'unknown'}. Use their weak areas as context: ${weakAreasText}. Also consider their strong areas: ${strongAreasText}. Explain the concept ${concept} in a beginner-friendly, supportive way, define terms clearly, and connect ideas to familiar examples.`
      } else if (mastery_level === 'Proficient' || mastery_level === 'Strong') {
        systemPrompt = `You are a study tutor for ${subject}. Use Mode C: be technical, skip basic definitions unless needed, and focus on nuance and depth. The learner is currently at mastery level ${mastery_level}. Use their weak areas as context: ${weakAreasText}. Also consider their strong areas: ${strongAreasText}. Explain the concept ${concept} with concise, high-signal detail and address subtle distinctions.`
      } else {
        systemPrompt = `You are a study tutor for ${subject}. Use Mode A: be beginner-friendly, analogy-first, and define all terms clearly. The learner is currently at mastery level ${mastery_level}. Use their weak areas as context: ${weakAreasText}. Also consider their strong areas: ${strongAreasText}. Explain the concept ${concept} simply and accessibly.`
      }
    } else {
      systemPrompt = `You are a study tutor for ${subject}. Use Mode A: be beginner-friendly, analogy-first, and define all terms clearly. No matching concept row was found in the database, so assume the learner needs a foundational explanation of ${concept}.`
    }
  }

  const apiKey = getAnthropicApiKey()
  const authError = getAnthropicApiKeyError()

  if (!apiKey) {
    return new NextResponse(authError ?? 'The AI service is not configured right now. Please try again later.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  try {
    const result = streamText({
      model: createAnthropic({ apiKey })('claude-sonnet-4-5'),
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const encoder = new TextEncoder()
    const fallbackMessage = 'The AI service is currently unavailable because the provided API key is invalid. Please try again later.'
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (error) {
          const message = error instanceof Error && /invalid x-api-key|authentication_error/i.test(error.message)
            ? fallbackMessage
            : 'I could not generate a response right now. Please try again later.'

          controller.enqueue(encoder.encode(message))
          controller.close()
        }
      },
    })

    return new NextResponse(stream, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    const message = error instanceof Error && /invalid x-api-key|authentication_error/i.test(error.message)
      ? 'The AI service is currently unavailable because the provided API key is invalid. Please try again later.'
      : 'I could not generate a response right now. Please try again later.'

    return new NextResponse(message, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
