import * as React from 'react'
import { toast as toastManager } from '@/components/ui/toast'

interface ToastOptions {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: 'default' | 'destructive'
  action?: React.ReactNode
}

function toast({ variant, ...props }: ToastOptions) {
  const id = toastManager.add({
    ...props,
    type: variant === 'destructive' ? 'error' : undefined,
  })

  return {
    id,
    dismiss: () => toastManager.close(id),
    update: (next: ToastOptions) =>
      toastManager.update(id, {
        ...next,
        type: next.variant === 'destructive' ? 'error' : undefined,
      }),
  }
}

function useToast() {
  return { toast, dismiss: (toastId?: string) => toastManager.close(toastId) }
}

export { useToast, toast }
