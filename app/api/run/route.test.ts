import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function toNextRequest(req: Request): NextRequest {
  return req as unknown as NextRequest
}

function makeRequest(body: object) {
  return toNextRequest(
    new Request('http://localhost/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  )
}

async function loadRoute() {
  vi.resetModules()
  const { POST } = await import('./route')
  return POST
}

describe('POST /api/run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('returns 400 when no prompt provided', async () => {
    const POST = await loadRoute()
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('No prompt provided')
  })

  it('returns 500 when ANTHROPIC_API_KEY is not set', async () => {
    delete process.env.ANTHROPIC_API_KEY
    const POST = await loadRoute()
    const res = await POST(makeRequest({ prompt: 'Hello' }))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain('ANTHROPIC_API_KEY')
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('returns mock response in dev when MOCK_API is not false', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('MOCK_API', '')
    const POST = await loadRoute()
    const res = await POST(makeRequest({ prompt: 'Hello world' }))
    vi.unstubAllEnvs()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.content).toContain('[MOCK]')
    expect(data.content).toContain('11 chars')
    expect(data.inputTokens).toBeGreaterThan(0)
    expect(data.outputTokens).toBeGreaterThan(0)
    expect(data.latencyMs).toBeGreaterThan(0)
    expect(data.stopReason).toBe('end_turn')
  })

  it('returns 200 with content on successful API response', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: 'Hello from Claude' }],
        usage: { input_tokens: 10, output_tokens: 5 },
        model: 'claude-haiku-4-5-20251001',
        stop_reason: 'end_turn',
      }),
    })
    const POST = await loadRoute()
    const res = await POST(makeRequest({ prompt: 'Hi', model: 'claude-haiku-4-5-20251001' }))
    vi.unstubAllEnvs()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.content).toBe('Hello from Claude')
    expect(data.inputTokens).toBe(10)
    expect(data.outputTokens).toBe(5)
    expect(data.stopReason).toBe('end_turn')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://api.anthropic.com'),
      expect.any(Object)
    )
  })

  it('returns 400 with error message on API 4xx', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Invalid request' } }),
    })
    const POST = await loadRoute()
    const res = await POST(makeRequest({ prompt: 'Hi' }))
    vi.unstubAllEnvs()
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid request')
  })

  it('returns 500 on API fetch error', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const POST = await loadRoute()
    const res = await POST(makeRequest({ prompt: 'Hi' }))
    vi.unstubAllEnvs()
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Internal server error')
  })

  it('includes system prompt in request body when provided', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: 'OK' }],
        usage: { input_tokens: 20, output_tokens: 2 },
        model: 'claude-haiku-4-5-20251001',
        stop_reason: 'end_turn',
      }),
    })
    const POST = await loadRoute()
    await POST(makeRequest({ prompt: 'Hi', system: 'You are helpful' }))
    vi.unstubAllEnvs()
    expect(mockFetch).toHaveBeenCalled()
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody.system).toBe('You are helpful')
  })
})
