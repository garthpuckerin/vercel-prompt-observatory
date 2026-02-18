import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

// Mock fetch before importing the route
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function toNextRequest(req: Request): NextRequest {
  return req as unknown as NextRequest
}

describe('POST /api/run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('returns 400 when no prompt provided', async () => {
    const { POST } = await import('./route')
    const req = toNextRequest(
      new Request('http://localhost/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    )
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('No prompt provided')
  })

  it('returns 500 when ANTHROPIC_API_KEY is not set', async () => {
    delete process.env.ANTHROPIC_API_KEY
    const { POST } = await import('./route')
    const req = toNextRequest(
      new Request('http://localhost/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Hello' }),
      })
    )
    const res = await POST(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain('ANTHROPIC_API_KEY')
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })
})
