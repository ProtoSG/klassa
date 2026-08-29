'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Sparkles, X, Send } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAssistantChat } from '@/shared/store/assistant'
import { sendMessage } from '../actions'
import type { ChatMessage } from '../types'

export default function AssistantChat() {
  const open = useAssistantChat((s) => s.open)
  const close = useAssistantChat((s) => s.close)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) textareaRef.current?.focus()
  }, [open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const reply = await sendMessage(history)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'No pude procesar tu consulta. Intentá de nuevo.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col rounded-2xl border border-line bg-canvas shadow-hover md:bottom-8 md:right-8"
      style={{ height: 'min(70vh, 480px)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
          <Sparkles size={16} className="text-ink" />
        </div>
        <span className="text-sm font-semibold text-ink flex-1">Asistente</span>
        <button
          onClick={close}
          aria-label="Cerrar chat"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ghost hover:text-ink hover:bg-muted-fill transition-colors duration-150"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !loading && (
          <p className="text-center text-xs text-ghost pt-8">
            Hacete una pregunta sobre alumnos, calificaciones, asistencia o saldos.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-ink text-white border border-ink'
                  : 'bg-muted-fill text-ink border border-line'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-strong:text-ink prose-table:text-xs prose-th:text-left prose-td:py-0.5 prose-td:pr-3 max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl bg-muted-fill border border-line px-3 py-2">
              <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse [animation-delay:150ms]" />
              <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-line px-3 py-2 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder="Escribí tu pregunta…"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ghost focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Enviar"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
