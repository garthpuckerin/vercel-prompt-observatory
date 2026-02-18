'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', speed: 'fastest' },
  { id: 'claude-sonnet-4-20250514', label: 'Sonnet 4', speed: 'balanced' },
]

const STARTER_PROMPTS = [
  {
    label: 'Structured extraction',
    system: 'You are a data extraction assistant. Always respond with valid JSON only, no prose.',
    prompt:
      'Extract the key entities from this text:\n\n"Garth Puckerin manages LMS integrations between Workday and Docebo at Entrust Corporation, reporting to the VP of Talent Development, Sarah Chen."',
  },
  {
    label: 'Classification',
    system:
      'Classify support tickets by priority (P0/P1/P2/P3) and category. Respond only with JSON: {"priority": "", "category": "", "reasoning": ""}',
    prompt:
      'Ticket: Users in the Northeast region cannot log into the LMS since 9am. SSO is returning a 403. Affecting ~800 users.',
  },
  {
    label: 'Content rewrite',
    system:
      'You are a technical writer. Rewrite content to be clear, concise, and scannable for a developer audience.',
    prompt:
      'Rewrite this for developers:\n\n"The learning management system provides functionality that enables the configuration of automated notification workflows which can be triggered by various learner activity events within the platform."',
  },
  {
    label: 'Drift detection',
    system:
      'You are a documentation analyst. Compare two API specs and return JSON: {"breaking": [], "behavioral": [], "docUpdates": [], "confidence": 0.0}',
    prompt:
      'OLD: POST /users requires {name, email}\nNEW: POST /users requires {firstName, lastName, email, role} where role is required enum: [admin, learner, manager]',
  },
]

type RunResult = {
  id: string
  prompt: string
  system: string
  model: string
  content: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  stopReason: string
  timestamp: number
  label?: string
}

function MetricPill({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '8px 14px',
        border: `1px solid ${highlight ? '#000' : '#e0e0e0'}`,
        background: highlight ? '#000' : '#fff',
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          color: highlight ? '#666' : '#999',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 16,
          fontWeight: 600,
          color: highlight ? '#fff' : '#000',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function ResultCard({
  result,
  isLatest,
  onLabel,
}: {
  result: RunResult
  isLatest: boolean
  onLabel: (id: string, label: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [labelInput, setLabelInput] = useState(result.label || '')
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(result.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const saveLabel = () => {
    onLabel(result.id, labelInput)
    setEditing(false)
  }

  const totalTokens = result.inputTokens + result.outputTokens
  const tokensPerSec = Math.round((result.outputTokens / result.latencyMs) * 1000)

  return (
    <div
      style={{
        border: `1px solid ${isLatest ? '#000' : '#e0e0e0'}`,
        background: '#fff',
        animation: 'slideDown 0.25s ease forwards',
      }}
    >
      {/* Card header */}
      <div
        style={{
          borderBottom: '1px solid #e8e8e8',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isLatest ? '#000' : '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isLatest && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                color: '#fff',
                background: '#333',
                padding: '2px 8px',
                letterSpacing: '0.1em',
              }}
            >
              LATEST
            </span>
          )}
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: isLatest ? '#888' : '#999',
            }}
          >
            {new Date(result.timestamp).toLocaleTimeString()}
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: isLatest ? '#666' : '#bbb',
            }}
          >
            {result.model.includes('haiku') ? 'haiku-4.5' : 'sonnet-4'}
          </span>
          {editing ? (
            <input
              autoFocus
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={(e) => e.key === 'Enter' && saveLabel()}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #666',
                color: isLatest ? '#fff' : '#000',
                outline: 'none',
                width: 120,
              }}
              placeholder="label this run..."
            />
          ) : (
            <span
              onClick={() => setEditing(true)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: result.label ? (isLatest ? '#ccc' : '#555') : '#bbb',
                cursor: 'text',
                borderBottom: '1px dashed #ccc',
              }}
            >
              {result.label || 'add label'}
            </span>
          )}
        </div>
        <button
          onClick={copy}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            background: 'transparent',
            border: '1px solid #444',
            color: isLatest ? '#888' : '#999',
            padding: '4px 10px',
            cursor: 'pointer',
            letterSpacing: '0.08em',
          }}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e8e8e8' }}>
        {[
          { label: 'Latency', value: `${result.latencyMs}ms` },
          { label: 'Input tok', value: result.inputTokens.toString() },
          { label: 'Output tok', value: result.outputTokens.toString() },
          { label: 'Total tok', value: totalTokens.toString() },
          { label: 'Tok/sec', value: tokensPerSec.toString() },
          { label: 'Stop', value: result.stopReason },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRight: i < 5 ? '1px solid #e8e8e8' : 'none',
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                color: '#aaa',
                letterSpacing: '0.1em',
                marginBottom: 3,
              }}
            >
              {m.label.toUpperCase()}
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 13,
                fontWeight: 600,
                color: '#000',
              }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Output */}
      <div style={{ padding: '16px', maxHeight: 300, overflowY: 'auto' }}>
        <pre
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: '#1a1a1a',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
          }}
        >
          {result.content}
        </pre>
      </div>
    </div>
  )
}

export default function PromptObservatory() {
  const [prompt, setPrompt] = useState('')
  const [system, setSystem] = useState('')
  const [model, setModel] = useState('claude-haiku-4-5-20251001')
  const [results, setResults] = useState<RunResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSystem, setShowSystem] = useState(false)
  const [runCount, setRunCount] = useState(0)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        run()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run is stable, avoids circular deps
    [prompt, system, model, isRunning]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const loadStarter = (starter: (typeof STARTER_PROMPTS)[0]) => {
    setPrompt(starter.prompt)
    setSystem(starter.system)
    setShowSystem(true)
    promptRef.current?.focus()
  }

  const run = async () => {
    if (!prompt.trim() || isRunning) return
    setIsRunning(true)
    setError(null)
    const id = `run-${Date.now()}`

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, system, model }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      const result: RunResult = {
        id,
        prompt,
        system,
        model,
        content: data.content,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        latencyMs: data.latencyMs,
        stopReason: data.stopReason,
        timestamp: Date.now(),
      }

      setResults((prev) => [result, ...prev])
      setRunCount((c) => c + 1)

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch {
      setError('Network error — is the server running?')
    } finally {
      setIsRunning(false)
    }
  }

  const updateLabel = (id: string, label: string) => {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, label } : r)))
  }

  const clearResults = () => setResults([])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f4f0',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #000; color: #fff; }
        textarea { resize: none; }
        textarea:focus, input:focus, button:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #f0f0ec; }
        ::-webkit-scrollbar-thumb { background: #ccc; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .run-btn:hover:not(:disabled) { background: #222 !important; }
        .run-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .starter:hover { background: #f0f0ec !important; border-color: #999 !important; }
        .model-opt:hover { border-color: #999 !important; }
        .clear-btn:hover { color: #000 !important; border-color: #000 !important; }
      `}</style>

      {/* Header */}
      <div
        style={{
          borderBottom: '2px solid #000',
          padding: '0 24px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            PROMPT OBSERVATORY
          </span>
          <span style={{ color: '#ccc' }}>|</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#888' }}>
            test · compare · version
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {runCount > 0 && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#888' }}>
              {runCount} run{runCount !== 1 ? 's' : ''}
            </span>
          )}
          <a
            href="/api-docs"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: '#000',
              border: '1px solid #000',
              padding: '3px 10px',
              textDecoration: 'none',
            }}
          >
            API docs
          </a>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: '#000',
              border: '1px solid #000',
              padding: '3px 10px',
            }}
          >
            ⌘↵ to run
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Starters */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: '#888',
              letterSpacing: '0.12em',
              marginBottom: 10,
            }}
          >
            STARTER PROMPTS
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STARTER_PROMPTS.map((s, i) => (
              <button
                key={i}
                className="starter"
                onClick={() => loadStarter(s)}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  padding: '6px 14px',
                  background: '#fff',
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                  color: '#444',
                  transition: 'all 0.1s ease',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div style={{ border: '2px solid #000', background: '#fff', marginBottom: 24 }}>
          {/* Model selector */}
          <div
            style={{
              borderBottom: '1px solid #e8e8e8',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: '#888',
                letterSpacing: '0.1em',
                marginRight: 4,
              }}
            >
              MODEL
            </span>
            {MODELS.map((m) => (
              <button
                key={m.id}
                className="model-opt"
                onClick={() => setModel(m.id)}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  padding: '4px 12px',
                  background: model === m.id ? '#000' : 'transparent',
                  border: `1px solid ${model === m.id ? '#000' : '#ddd'}`,
                  color: model === m.id ? '#fff' : '#666',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                }}
              >
                {m.label} <span style={{ opacity: 0.5, fontSize: 9 }}>· {m.speed}</span>
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setShowSystem(!showSystem)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                background: showSystem ? '#000' : 'transparent',
                border: `1px solid ${showSystem ? '#000' : '#ddd'}`,
                color: showSystem ? '#fff' : '#888',
                padding: '4px 12px',
                cursor: 'pointer',
                letterSpacing: '0.08em',
              }}
            >
              SYSTEM {showSystem ? '▲' : '▼'}
            </button>
          </div>

          {/* System prompt */}
          {showSystem && (
            <div style={{ borderBottom: '1px solid #e8e8e8' }}>
              <div style={{ padding: '6px 16px', borderBottom: '1px solid #f0f0f0' }}>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    color: '#aaa',
                    letterSpacing: '0.12em',
                  }}
                >
                  SYSTEM PROMPT
                </span>
              </div>
              <textarea
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                placeholder="Optional system prompt..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                  color: '#333',
                  background: '#fafafa',
                  border: 'none',
                  lineHeight: 1.6,
                }}
              />
            </div>
          )}

          {/* Prompt */}
          <div style={{ position: 'relative' }}>
            <div style={{ padding: '6px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9,
                  color: '#aaa',
                  letterSpacing: '0.12em',
                }}
              >
                USER PROMPT
              </span>
            </div>
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Write your prompt here..."
              rows={6}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 13,
                color: '#000',
                background: '#fff',
                border: 'none',
                lineHeight: 1.7,
              }}
            />
          </div>

          {/* Run bar */}
          <div
            style={{
              borderTop: '1px solid #e8e8e8',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fafafa',
            }}
          >
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#bbb' }}>
              {prompt.length > 0 ? `${prompt.length} chars` : 'waiting for input'}
            </div>
            <button
              className="run-btn"
              onClick={run}
              disabled={!prompt.trim() || isRunning}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                padding: '10px 28px',
                background: '#000',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.1em',
                transition: 'background 0.1s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {isRunning ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>
                    ◌
                  </span>
                  RUNNING
                </>
              ) : (
                <>RUN ⌘↵</>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              border: '1px solid #000',
              padding: '12px 16px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: '#000',
              background: '#fff',
              marginBottom: 16,
            }}
          >
            ✗ {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div ref={resultsRef}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#888',
                  letterSpacing: '0.12em',
                }}
              >
                RESULTS — {results.length} run{results.length !== 1 ? 's' : ''}
              </div>
              <button
                className="clear-btn"
                onClick={clearResults}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  background: 'transparent',
                  border: '1px solid #ddd',
                  color: '#aaa',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                  transition: 'all 0.1s ease',
                }}
              >
                CLEAR
              </button>
            </div>

            {/* Comparison metrics when 2+ runs */}
            {results.length >= 2 && (
              <div
                style={{
                  border: '1px solid #000',
                  background: '#fff',
                  padding: '14px 16px',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    color: '#888',
                    letterSpacing: '0.12em',
                    marginBottom: 12,
                  }}
                >
                  RUN COMPARISON
                </div>
                <div style={{ display: 'flex', gap: 0 }}>
                  {results
                    .slice(0, 4)
                    .reverse()
                    .map((r, i) => (
                      <div
                        key={r.id}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRight:
                            i < Math.min(results.length, 4) - 1 ? '1px solid #e8e8e8' : 'none',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 9,
                            color: '#bbb',
                            marginBottom: 6,
                          }}
                        >
                          {r.label || `run ${results.length - i}`}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {[
                            { k: 'latency', v: `${r.latencyMs}ms` },
                            { k: 'tokens', v: `${r.inputTokens + r.outputTokens}` },
                            { k: 'output', v: `${r.outputTokens}` },
                          ].map((m) => (
                            <div
                              key={m.k}
                              style={{ display: 'flex', justifyContent: 'space-between' }}
                            >
                              <span
                                style={{
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  fontSize: 9,
                                  color: '#aaa',
                                }}
                              >
                                {m.k}
                              </span>
                              <span
                                style={{
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: '#000',
                                }}
                              >
                                {m.v}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {results.map((result, i) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  isLatest={i === 0}
                  onLabel={updateLabel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !isRunning && (
          <div
            style={{
              border: '1px dashed #ccc',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: '#bbb',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}
            >
              NO RUNS YET
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#999' }}>
              Write a prompt and press ⌘↵ to run
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
