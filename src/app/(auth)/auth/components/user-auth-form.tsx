'use client'

import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

type UserAuthFormProps = HTMLAttributes<HTMLDivElement>

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter your email' })
    .email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(1, { message: 'Please enter your password' }),
})

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await login({
        email: data.email,
        password: data.password,
      })

      if (!result.success) {
        setErrorMessage(result.error || 'Login failed. Please check your credentials.')
        toast({
          variant: 'destructive',
          title: 'Sign In Failed',
          description: result.error || 'Invalid email or password.',
        })
        setIsLoading(false)
        return
      }

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      })

      router.push(callbackUrl as '/' | '/auth/sign-in')
      router.refresh()
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.')
      toast({
        variant: 'destructive',
        title: 'Sign In Error',
        description: 'Unable to connect to the server. Please try again.',
      })
      setIsLoading(false)
    }
  }

  function handleGoogleSignIn() {
    setIsOAuthLoading(true)
    window.location.href = '/api/auth/signin/google'
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      {errorMessage && (
        <div className='rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20'>
          {errorMessage}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-2'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='name@example.com'
                      autoComplete='email'
                      disabled={isLoading || isOAuthLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <FormLabel>Password</FormLabel>
                    <Link
                      href='/auth/forgot-password'
                      className='text-sm font-medium text-muted-foreground hover:opacity-75'
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput
                      placeholder='********'
                      autoComplete='current-password'
                      disabled={isLoading || isOAuthLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className='mt-2' type='submit' disabled={isLoading || isOAuthLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Sign In
            </Button>

            <div className='relative my-2'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background px-2 text-muted-foreground'>
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant='outline'
              className='w-full'
              type='button'
              disabled={isLoading || isOAuthLoading}
              onClick={handleGoogleSignIn}
            >
              {isOAuthLoading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <svg className='mr-2 h-4 w-4' viewBox='0 0 24 24'>
                  <path
                    d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    fill='#4285F4'
                  />
                  <path
                    d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    fill='#34A853'
                  />
                  <path
                    d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z'
                    fill='#FBBC05'
                  />
                  <path
                    d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
                    fill='#EA4335'
                  />
                </svg>
              )}
              Continue with Google
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
