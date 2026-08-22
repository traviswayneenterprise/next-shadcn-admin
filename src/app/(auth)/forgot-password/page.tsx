'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { ForgotForm } from './components/forgot-password-form'

export default function ForgotPassword() {
  return (
    <Card className='p-6'>
      <div className='mb-2 flex flex-col space-y-2 text-left'>
        <h1 className='text-xl font-semibold tracking-tight'>
          Forgot Password
        </h1>
        <p className='text-sm text-muted-foreground'>
          Enter your registered email and we will send you instructions to reset your password.
        </p>
      </div>
      <ForgotForm />
      <p className='mt-4 px-8 text-center text-sm text-muted-foreground'>
        Remember your password?{' '}
        <Link
          href='/auth/sign-in'
          className='underline underline-offset-4 hover:text-primary font-medium text-foreground'
        >
          Sign in
        </Link>
      </p>
    </Card>
  )
}
