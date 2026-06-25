"use client"

import { useEffect, useState } from 'react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
  subject?: string
  concept?: string
  showSaveButton?: boolean
  saveState?: 'idle' | 'saving' | 'saved'
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function parseListItems(value: string) {
  return value
    .split(/\n|;/)
    .map((item) => item.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)
}

function buildSavePayload(message: string, subject: string, concept: string) {
  const lines = message
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)

  const overview = lines[0] ?? message.trim()
  const deepDive = lines.slice(1, 4).filter(Boolean)

  const strongAreas = parseListItems(message.match(/strong areas[:\-]?([\s\S]*?)(?=\n\s*(weak areas|next steps|notes|$))/i)?.[1] ?? '')
  const weakAreas = parseListItems(message.match(/weak areas[:\-]?([\s\S]*?)(?=\n\s*(strong areas|next steps|notes|$))/i)?.[1] ?? '')
  const nextSteps = parseListItems(message.match(/next steps[:\-]?([\s\S]*?)(?=\n\s*(notes|$))/i)?.[1] ?? '')

  return {
    subject,
    concept,
    masteryLevel: 'Developing',
    overviewGist: overview,
    deepDiveGist: deepDive,
    strongAreas,
    weakAreas,
    nextSteps,
    notes: message,
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isTyping = input.trim().length > 0
  const showActivePalette = true

  useEffect(() => {
    const background = isLoading
      ? 'linear-gradient(135deg, #ff5a36 0%, #facc15 100%)'
      : 'linear-gradient(135deg, #2563eb 0%, #ff5a36 60%, #facc15 100%)'

    document.documentElement.style.setProperty('--app-bg', background)
    document.body.style.background = background

    return () => {
      document.documentElement.style.setProperty('--app-bg', '#f3f4f6')
      document.body.style.background = '#f3f4f6'
    }
  }, [isLoading])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: createId(),
      role: 'user',
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const assistantId = createId()
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        pending: true,
      },
    ])

    try {
      const detectResponse = await fetch('/api/detect-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: trimmed }),
      })

      const detected = (await detectResponse.json()) as { subject?: string; concept?: string }
      const subject = typeof detected.subject === 'string' ? detected.subject : ''
      const concept = typeof detected.concept === 'string' ? detected.concept : ''

      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: trimmed, subject, concept }),
      })

      if (!chatResponse.ok || !chatResponse.body) {
        throw new Error('Unable to stream a response right now.')
      }

      const reader = chatResponse.body.getReader()
      const decoder = new TextDecoder()
      let streamed = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        streamed += chunk

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + chunk }
              : message
          )
        )
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                pending: false,
                subject,
                concept,
                showSaveButton: Boolean(subject && concept && streamed.trim()),
                saveState: 'idle',
              }
            : message
        )
      )
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                pending: false,
                content: error instanceof Error ? error.message : 'Something went wrong.',
              }
            : message
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave(message: Message) {
    if (!message.subject || !message.concept) return

    setMessages((prev) =>
      prev.map((item) =>
        item.id === message.id ? { ...item, saveState: 'saving' } : item
      )
    )

    try {
      const payload = buildSavePayload(message.content, message.subject, message.concept)
      const response = await fetch('/api/save-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Unable to save progress right now.')
      }

      setMessages((prev) =>
        prev.map((item) =>
          item.id === message.id ? { ...item, saveState: 'saved' } : item
        )
      )
    } catch {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === message.id ? { ...item, saveState: 'idle' } : item
        )
      )
    }
  }

  return (
    <div
      suppressHydrationWarning
      className={`flex flex-1 flex-col gap-4 rounded-2xl border p-2 transition-colors duration-300 ${
        showActivePalette
          ? 'border-[#2563eb]/60'
          : 'border-slate-800/70'
      }`}
      style={{ background: 'var(--app-bg, #f3f4f6)' }}
    >
      <header
        className={`rounded-2xl border bg-slate-950/70 px-5 py-4 shadow-lg shadow-slate-950/40 ${
          showActivePalette ? 'border-[#ff5a36]/60' : 'border-red-200/60'
        }`}
      >
        <h1 className="text-xl font-semibold">Study Agent</h1>
        <p className="mt-1 text-sm text-slate-400">
          Ask a concept question and I will tutor you in real time.
        </p>
      </header>

      <section
        className={`flex-1 overflow-y-auto rounded-2xl border bg-slate-950/70 p-3 sm:p-4 ${
          showActivePalette ? 'border-[#2563eb]/60' : 'border-red-200/60'
        }`}
      >
        <div className="flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
              Start by asking about a concept, topic, or chapter.
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  message.role === 'user'
                    ? 'bg-blue-700 text-slate-50'
                    : 'border border-slate-800 bg-slate-950/80 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                {message.role === 'assistant' && message.showSaveButton && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => handleSave(message)}
                      disabled={message.saveState === 'saving' || message.saveState === 'saved'}
                      className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {message.saveState === 'saving'
                        ? 'Saving...'
                        : message.saveState === 'saved'
                          ? 'Saved'
                          : 'Save progress'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <form
        className={`flex flex-col gap-3 rounded-2xl border bg-slate-950/80 p-3 shadow-lg shadow-slate-950/40 sm:flex-row ${
          showActivePalette ? 'border-[#facc15]/60' : 'border-red-200/60'
        }`}
        onSubmit={(event) => {
          event.preventDefault()
          void handleSend()
        }}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void handleSend()
            }
          }}
          placeholder="Ask about a concept or topic..."
          className="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-700 ${
            showActivePalette
              ? 'bg-[#ff5a36] text-white hover:bg-[#fb6c45]'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
