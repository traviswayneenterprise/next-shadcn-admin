'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { SignUpForm } from './components/sign-up-form'

export default function SignUp() {
  return (
    <Card className='p-6'>
      <div className='mb-2 flex flex-col space-y-2 text-left'>
        <h1 className='text-xl font-semibold tracking-tight'>
          Create an account
        </h1>
        <p className='text-sm text-muted-foreground'>
          Enter your details below to create your account. <br />
          Already have an account?{' '}
          <Link
            href='/auth/sign-in'
            className='underline underline-offset-4 hover:text-primary font-medium text-foreground'
          >
            Sign In
          </Link>
        </p>
      </div>
      <SignUpForm />
      <p className='mt-4 px-8 text-center text-xs text-muted-foreground'>
        By creating an account, you agree to our{' '}
        <span className='underline underline-offset-4 hover:text-primary cursor-pointer'>
          Terms of Service
        </span>{' '}
        and{' '}
        <span className='underline underline-offset-4 hover:text-primary cursor-pointer'>
          Privacy Policy
        </span>
        .
      </p>
    </Card>
  )
}
