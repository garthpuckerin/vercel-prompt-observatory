import { NextResponse } from 'next/server'

/**
 * OpenAPI 3.0 specification for the Prompt Observatory API.
 * Served at /api/openapi for Swagger UI consumption.
 */
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Prompt Observatory API',
    description:
      'API for testing and comparing Claude prompts with latency metrics, token counting, and run versioning.',
    version: '1.0.0',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
      description: 'API Server',
    },
  ],
  paths: {
    '/api/run': {
      post: {
        summary: 'Run a prompt',
        description:
          'Execute a user prompt against Claude (Haiku or Sonnet) and return the response with token counts and latency metrics. In dev mode (NODE_ENV=development), returns mock data unless MOCK_API=false.',
        operationId: 'runPrompt',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prompt'],
                properties: {
                  prompt: {
                    type: 'string',
                    description: 'The user prompt to send to Claude',
                  },
                  system: {
                    type: 'string',
                    description: 'Optional system prompt for context/instructions',
                  },
                  model: {
                    type: 'string',
                    enum: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-20250514'],
                    default: 'claude-haiku-4-5-20251001',
                    description: 'Claude model to use',
                  },
                  temperature: {
                    type: 'number',
                    description: 'Optional temperature for response variability',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    content: { type: 'string', description: 'Model output text' },
                    inputTokens: { type: 'integer', description: 'Input token count' },
                    outputTokens: { type: 'integer', description: 'Output token count' },
                    latencyMs: { type: 'integer', description: 'Request latency in milliseconds' },
                    model: { type: 'string', description: 'Model used' },
                    stopReason: { type: 'string', description: 'Reason generation stopped' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad request - no prompt provided',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
          500: {
            description: 'Server error - API key not configured or Claude API error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

export async function GET() {
  return NextResponse.json(openApiSpec)
}
