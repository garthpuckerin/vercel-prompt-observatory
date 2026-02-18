import { NextRequest, NextResponse } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'
const useMock = isDev && process.env.MOCK_API !== 'false'

function mockResponse(prompt: string, model: string) {
  const inputTokens = Math.ceil(prompt.length / 4) + 50
  const outputTokens = 80 + Math.floor(Math.random() * 40)
  const latencyMs = 200 + Math.floor(Math.random() * 300)
  return {
    content: `[MOCK] Response to your prompt (${prompt.length} chars):\n\nThis is a simulated Claude response. Set MOCK_API=false and add ANTHROPIC_API_KEY to use the real API.`,
    inputTokens,
    outputTokens,
    latencyMs,
    model: model || 'claude-haiku-4-5-20251001',
    stopReason: 'end_turn',
  }
}

export async function POST(req: NextRequest) {
  const { prompt, system, model } = await req.json()

  if (!prompt) {
    return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })
  }

  if (useMock) {
    await new Promise((r) => setTimeout(r, 150 + Math.random() * 200))
    return NextResponse.json(mockResponse(prompt, model))
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const start = Date.now()

  try {
    const body: Record<string, unknown> = {
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }

    if (system) body.system = system

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    const latency = Date.now() - start

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Claude API error' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      content: data.content?.[0]?.text || '',
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      latencyMs: latency,
      model: data.model,
      stopReason: data.stop_reason,
    })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
