'use client'

import { Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { UserAuthForm } from '../components/user-auth-form'

export default function SignIn() {
  return (
    <Card className='p-6'>
      <div className='flex flex-col space-y-2 text-left'>
        <h1 className='text-2xl font-semibold tracking-tight'>Sign in</h1>
        <p className='text-sm text-muted-foreground'>
          Enter your credentials to access the operating system
        </p>
      </div>
      <Suspense fallback={null}>
        <UserAuthForm />
      </Suspense>
      <p className='mt-4 px-8 text-center text-xs text-muted-foreground'>
        Accounts are provisioned by the Admin. Contact your administrator for access.
      </p>
    </Card>
  )
}
