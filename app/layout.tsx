import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prompt Observatory — Test, Compare, Version',
  description:
    'A developer tool for testing and comparing Claude prompts with latency metrics, token counting, and run versioning.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#f4f4f0' }}>{children}</body>
    </html>
  )
}
