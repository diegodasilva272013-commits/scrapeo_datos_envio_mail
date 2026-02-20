'use client'

import { useEffect, useRef } from 'react'

interface LogViewerProps {
  logs: string[]
  running?: boolean
}

export default function LogViewer({ logs, running }: LogViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  if (logs.length === 0 && !running) return null

  return (
    <div className="card mt-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${running ? 'bg-success animate-pulse' : 'bg-muted'}`} />
        <span className="text-text-dim text-xs font-mono uppercase tracking-wider">
          {running ? 'Ejecutando...' : 'Log de ejecución'}
        </span>
      </div>
      <div className="bg-bg rounded-xl border border-border p-4 font-mono text-xs max-h-72 overflow-y-auto">
        {logs.map((log, i) => (
          <div
            key={i}
            className={`leading-relaxed ${
              log.includes('❌') ? 'text-danger' :
              log.includes('✅') ? 'text-success' :
              log.includes('⚠️') ? 'text-warning' :
              log.startsWith('\n') ? 'text-accent font-semibold mt-2' :
              'text-text-dim'
            }`}
          >
            {log}
          </div>
        ))}
        {running && (
          <div className="flex items-center gap-2 text-accent mt-1">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <span>procesando</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
