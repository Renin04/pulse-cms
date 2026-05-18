'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, AlertCircle, X, Info, Loader2 } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'loading'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-[14px] w-[14px] text-emerald-600" strokeWidth={2.5} />,
  error:   <AlertCircle className="h-[14px] w-[14px] text-red-600" strokeWidth={2.5} />,
  info:    <Info className="h-[14px] w-[14px] text-sky-600" strokeWidth={2.5} />,
  loading: <Loader2 className="h-[14px] w-[14px] animate-spin text-amber-600" strokeWidth={2.5} />,
}

const DURATION = 4000

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (toast.type === 'loading') return
    timerRef.current = setTimeout(() => onDismiss(toast.id), DURATION)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [toast.id, toast.type, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-2 rounded-lg border border-[var(--neutral-200)] bg-white px-3 py-[6px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
      style={{ minWidth: 180, maxWidth: 300 }}
    >
      {ICONS[toast.type]}
      <span className="flex-1 truncate text-[12px] font-semibold text-[var(--pulse-black)]">
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-[3px] text-[var(--neutral-400)] transition-colors hover:bg-[var(--neutral-100)] hover:text-[var(--pulse-black)]"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" strokeWidth={2.5} />
      </button>
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts(prev => {
      if (prev.some(t => t.message === message && t.type === type)) return prev
      return [...prev.slice(-4), { id, message, type }]
    })
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-1.5">
        <AnimatePresence>
          {toasts.map(toast => (
            <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
