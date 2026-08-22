'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className='flex h-svh w-full overflow-hidden bg-background'>
      {/* Sidebar Skeleton */}
      <div className='hidden md:flex h-full w-64 flex-col border-r bg-sidebar p-4 space-y-4'>
        <div className='flex items-center gap-3 px-2 py-2'>
          <Skeleton className='h-8 w-8 rounded-lg' />
          <Skeleton className='h-5 w-32' />
        </div>
        <div className='space-y-2 pt-4'>
          <Skeleton className='h-8 w-full rounded-md' />
          <Skeleton className='h-8 w-full rounded-md' />
          <Skeleton className='h-8 w-full rounded-md' />
          <Skeleton className='h-8 w-full rounded-md' />
        </div>
        <div className='mt-auto flex items-center gap-3 border-t pt-4 px-2'>
          <Skeleton className='h-9 w-9 rounded-full' />
          <div className='space-y-1.5 flex-1'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-3 w-32' />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Header Skeleton */}
        <div className='flex h-16 items-center justify-between border-b px-6'>
          <Skeleton className='h-6 w-36' />
          <div className='flex items-center gap-3'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <Skeleton className='h-8 w-8 rounded-full' />
          </div>
        </div>

        {/* Body Content Skeleton */}
        <div className='flex-1 p-6 space-y-6 overflow-y-auto'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Skeleton className='h-28 rounded-xl' />
            <Skeleton className='h-28 rounded-xl' />
            <Skeleton className='h-28 rounded-xl' />
            <Skeleton className='h-28 rounded-xl' />
          </div>

          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
            <Skeleton className='h-80 col-span-4 rounded-xl' />
            <Skeleton className='h-80 col-span-3 rounded-xl' />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectUrl = pathname ? `/auth/sign-in?callbackUrl=${encodeURIComponent(pathname)}` : '/auth/sign-in'
      router.push(redirectUrl as '/auth/sign-in')
    }
  }, [isLoading, isAuthenticated, router, pathname])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!isAuthenticated || !user) {
    return <DashboardSkeleton />
  }

  return <>{children}</>
}
