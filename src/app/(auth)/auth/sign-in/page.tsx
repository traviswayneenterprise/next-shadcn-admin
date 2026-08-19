'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { UserAuthForm } from '../components/user-auth-form'

export default function SignIn() {
  return (
    <Card className='p-6'>
      <div className='flex flex-col space-y-2 text-left'>
        <h1 className='text-2xl font-semibold tracking-tight'>Login</h1>
        <p className='text-sm text-muted-foreground'>
          Enter your email and password below <br />
          to log into your account
        </p>
      </div>
      <UserAuthForm />
      <p className='mt-4 px-8 text-center text-sm text-muted-foreground'>
        Don't have an account?{' '}
        <Link
          href='/auth/sign-up'
          className='underline underline-offset-4 hover:text-primary font-medium text-foreground'
        >
          Sign up
        </Link>
      </p>
      <p className='mt-2 px-8 text-center text-xs text-muted-foreground'>
        By clicking login, you agree to our{' '}
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
