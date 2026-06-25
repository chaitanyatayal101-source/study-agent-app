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

type ChatSession = {
  id: string
  title: string
  messages: Message[]
  updatedAt: string
}

const SESSION_STORAGE_KEY = 'study-agent-chat-sessions'
const ACTIVE_SESSION_STORAGE_KEY = 'study-agent-active-session'
const MEMORY_ENABLED_STORAGE_KEY = 'study-agent-memory-enabled'

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

function createSession(title = 'New chat'): ChatSession {
  return {
    id: createId(),
    title,
    messages: [],
    updatedAt: new Date().toISOString(),
  }
}

function getSessionTitle(messages: Message[]) {
  const firstUserMessage = messages.find((message) => message.role === 'user')?.content?.trim()
  if (!firstUserMessage) return 'New chat'
  return firstUserMessage.length > 24 ? `${firstUserMessage.slice(0, 24)}...` : firstUserMessage
}

function loadStoredSessions() {
  if (typeof window === 'undefined') {
    return { sessions: [], activeSessionId: null, memoryEnabled: true }
  }

  try {
    const storedSessions = window.localStorage.getItem(SESSION_STORAGE_KEY)
    const storedActiveId = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
    const storedMemoryEnabled = window.localStorage.getItem(MEMORY_ENABLED_STORAGE_KEY)

    return {
      sessions: storedSessions ? (JSON.parse(storedSessions) as ChatSession[]) : [],
      activeSessionId: storedActiveId ?? null,
      memoryEnabled: storedMemoryEnabled === null ? true : (JSON.parse(storedMemoryEnabled) as boolean),
    }
  } catch {
    return { sessions: [], activeSessionId: null, memoryEnabled: true }
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [ready, setReady] = useState(false)
  const [saveProgressState, setSaveProgressState] = useState<'idle' | 'saving' | 'saved'>('idle')

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

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = loadStoredSessions()
    if (stored.sessions.length) {
      const initialSessionId = stored.activeSessionId ?? stored.sessions[0].id
      const initialSession = stored.sessions.find((session) => session.id === initialSessionId) ?? stored.sessions[0]

      setSessions(stored.sessions)
      setActiveSessionId(initialSessionId)
      setMessages(initialSession?.messages ?? [])
    } else {
      const newSession = createSession('New chat')
      setSessions([newSession])
      setActiveSessionId(newSession.id)
      setMessages([])
    }

    setMemoryEnabled(stored.memoryEnabled)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return

    if (!memoryEnabled) {
      window.localStorage.setItem(MEMORY_ENABLED_STORAGE_KEY, JSON.stringify(false))
      return
    }

    window.localStorage.setItem(MEMORY_ENABLED_STORAGE_KEY, JSON.stringify(true))
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions))
    if (activeSessionId) {
      window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId)
    }
  }, [activeSessionId, memoryEnabled, ready, sessions])

  useEffect(() => {
    if (!ready || !activeSessionId) return

    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              messages,
              title: getSessionTitle(messages),
              updatedAt: new Date().toISOString(),
            }
          : session
      )
    )
  }, [activeSessionId, messages, ready])

  function handleNewChat() {
    const newSession = createSession('New chat')
    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    setMessages([])
    setInput('')
    setShowHistory(false)
  }

  function handleOpenSession(sessionId: string) {
    const selectedSession = sessions.find((session) => session.id === sessionId)
    if (!selectedSession) return

    setActiveSessionId(sessionId)
    setMessages(selectedSession.messages)
    setShowHistory(false)
  }

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    if (!activeSessionId) {
      const newSession = createSession('New chat')
      setSessions((prev) => [newSession, ...prev])
      setActiveSessionId(newSession.id)
      setMessages([])
    }

    const userMessage: Message = {
      id: createId(),
      role: 'user',
      content: trimmed,
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
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
                showSaveButton: Boolean(streamed.trim()),
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
    const subject = (message.subject ?? '').trim() || (typeof window !== 'undefined' ? window.prompt('Enter the subject', '')?.trim() ?? '' : '')
    const concept = (message.concept ?? '').trim() || (typeof window !== 'undefined' ? window.prompt('Enter the concept', '')?.trim() ?? '' : '')

    if (!subject || !concept || !message.content.trim()) return

    setMessages((prev) =>
      prev.map((item) =>
        item.id === message.id ? { ...item, saveState: 'saving' } : item
      )
    )

    try {
      const payload = buildSavePayload(message.content, subject, concept)
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

  async function handleSaveLatestProgress() {
    const latestAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant' && message.content.trim() && !message.pending)

    if (!latestAssistantMessage) return

    const subject = (latestAssistantMessage.subject ?? '').trim() || (typeof window !== 'undefined' ? window.prompt('Enter the subject', '')?.trim() ?? '' : '')
    const concept = (latestAssistantMessage.concept ?? '').trim() || (typeof window !== 'undefined' ? window.prompt('Enter the concept', '')?.trim() ?? '' : '')

    if (!subject || !concept || !latestAssistantMessage.content.trim()) return

    setSaveProgressState('saving')

    try {
      const payload = buildSavePayload(latestAssistantMessage.content, subject, concept)
      const response = await fetch('/api/save-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Unable to save progress right now.')
      }

      setSaveProgressState('saved')
    } catch {
      setSaveProgressState('idle')
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Study Agent</h1>
            <p className="mt-1 text-sm text-slate-400">
              Ask a concept question and I will tutor you in real time.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {memoryEnabled
                ? 'Your chats are saved locally on this device, even after you close the tab.'
                : 'Memory is paused. Chats will not be stored on this device.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-white"
            >
              New chat
            </button>
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-white"
            >
              {showHistory ? 'Hide history' : 'View history'}
            </button>
            <button
              type="button"
              onClick={() => void handleSaveLatestProgress()}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-white"
            >
              {saveProgressState === 'saving'
                ? 'Saving...'
                : saveProgressState === 'saved'
                  ? 'Saved'
                  : 'Save progress'}
            </button>
            <button
              type="button"
              onClick={() => setMemoryEnabled((prev) => !prev)}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-white"
            >
              {memoryEnabled ? 'Memory: On' : 'Memory: Off'}
            </button>
          </div>
        </div>
      </header>

      {showHistory && (
        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 shadow-lg shadow-slate-950/30">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Previous chats</h2>
            <span className="text-xs text-slate-500">Saved locally</span>
          </div>
          <div className="flex flex-col gap-2">
            {sessions.length === 0 && <p className="text-sm text-slate-500">No saved chats yet.</p>}
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => handleOpenSession(session.id)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                  activeSessionId === session.id
                    ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-100'
                    : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{session.title}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

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
