'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(() => import('swagger-ui-react').then((mod) => mod.default), {
  ssr: false,
  loading: () => <div style={{ padding: 24 }}>Loading API docs…</div>,
})

export default function ApiDocsPage() {
  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <SwaggerUI url="/api/openapi" />
    </div>
  )
}
