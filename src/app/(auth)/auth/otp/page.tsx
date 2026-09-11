'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { OtpForm } from './components/otp-form'

export default function Otp() {
  return (
    <Card className='p-6'>
      <div className='mb-2 flex flex-col space-y-2 text-left'>
        <h1 className='text-xl font-semibold tracking-tight'>
          Verify your email
        </h1>
        <p className='text-sm text-muted-foreground'>
          Please enter your email and verification code below to activate your account.
        </p>
      </div>
      <Suspense fallback={null}>
        <OtpForm />
      </Suspense>
      <p className='mt-4 px-8 text-center text-sm text-muted-foreground'>
        Already verified?{' '}
        <Link
          href='/auth/sign-in'
          className='underline underline-offset-4 hover:text-primary font-medium text-foreground'
        >
          Sign in to your account
        </Link>
      </p>
    </Card>
  )
}
