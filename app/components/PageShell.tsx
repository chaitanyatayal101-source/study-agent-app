'use client'

import { type ReactNode } from 'react'

import TopNav from './TopNav'

type PageShellProps = {
  children: ReactNode
  maxWidth?: string
}

export default function PageShell({ children, maxWidth = 'max-w-4xl' }: PageShellProps) {
  return (
    <div suppressHydrationWarning className="min-h-screen text-slate-100" style={{ backgroundColor: 'var(--app-bg, #f3f4f6)' }}>
      <main suppressHydrationWarning className={`mx-auto flex min-h-screen w-full ${maxWidth} flex-col px-4 py-6 sm:px-6 lg:px-8`} style={{ backgroundColor: 'var(--app-bg, #f3f4f6)' }}>
        <TopNav />
        {children}
      </main>
    </div>
  )
}
