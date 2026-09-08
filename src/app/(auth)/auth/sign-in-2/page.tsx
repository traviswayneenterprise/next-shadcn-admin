'use client'

import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { UserAuthForm } from '../components/user-auth-form'

export default function SignIn2() {
  return (
    <div className='fixed inset-0 grid grid-cols-1 lg:grid-cols-2'>
      <div className='relative hidden bg-black lg:block'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='absolute inset-0 flex flex-col'>
          <header className='relative z-20 p-10'>
            <div className='flex items-center text-lg font-medium text-white'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='mr-2 h-6 w-6'
              >
                <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
              </svg>
              TWE LMS
            </div>
          </header>

          <div className='relative z-20 flex flex-1 items-center justify-center p-10'>
            <Image
              src='/next.svg'
              className='h-auto w-[400px] invert'
              width={400}
              height={400}
              alt='TWE LMS'
              priority
            />
          </div>

          <div className='relative z-20 p-10'>
            <blockquote className='space-y-2 text-white'>
              <p className='text-lg'>
                &ldquo;TWE Learning provides a unified experience for comprehensive coursework, practical assessments, and verified certifications.&rdquo;
              </p>
              <footer className='text-sm text-zinc-400'>TWE Learning Platform</footer>
            </blockquote>
          </div>
        </div>
      </div>
      <div className='relative flex items-center justify-center p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
          <div className='flex flex-col space-y-2 text-left'>
            <h1 className='text-2xl font-semibold tracking-tight'>Login</h1>
            <p className='text-sm text-muted-foreground'>
              Enter your email and password below <br />
              to log into your account
            </p>
          </div>
          <Suspense fallback={null}>
            <UserAuthForm />
          </Suspense>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            Don&apos;t have an account?{' '}
            <Link
              href='/auth/sign-up'
              className='underline underline-offset-4 hover:text-primary font-medium text-foreground'
            >
              Sign up
            </Link>
          </p>
          <p className='px-8 text-center text-xs text-muted-foreground'>
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
        </div>
      </div>
    </div>
  )
}
