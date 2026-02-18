import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PromptObservatory from './PromptObservatory'

describe('PromptObservatory', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('renders header and starter prompts', () => {
    render(<PromptObservatory />)
    expect(screen.getByText('PROMPT OBSERVATORY')).toBeInTheDocument()
    expect(screen.getByText('Structured extraction')).toBeInTheDocument()
    expect(screen.getByText('Classification')).toBeInTheDocument()
  })

  it('loads starter prompt when clicked', async () => {
    const user = userEvent.setup()
    render(<PromptObservatory />)
    await user.click(screen.getByText('Structured extraction'))
    const textarea = screen.getByPlaceholderText('Write your prompt here...') as HTMLTextAreaElement
    expect(textarea.value).toContain('Extract the key entities')
  })

  it('shows empty state when no runs', () => {
    render(<PromptObservatory />)
    expect(screen.getByText('NO RUNS YET')).toBeInTheDocument()
  })

  it('displays result after successful run', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: 'Test response',
        inputTokens: 10,
        outputTokens: 5,
        latencyMs: 100,
        stopReason: 'end_turn',
      }),
    } as Response)

    render(<PromptObservatory />)
    const textarea = screen.getByPlaceholderText('Write your prompt here...')
    await user.type(textarea, 'Hello')
    await user.click(screen.getByRole('button', { name: /RUN/i }))

    expect(await screen.findByText('Test response')).toBeInTheDocument()
  })

  it('displays error when API returns error', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'API key invalid' }),
    } as Response)

    render(<PromptObservatory />)
    const textarea = screen.getByPlaceholderText('Write your prompt here...')
    await user.type(textarea, 'Hello')
    await user.click(screen.getByRole('button', { name: /RUN/i }))

    expect(await screen.findByText(/API key invalid/)).toBeInTheDocument()
  })
})
