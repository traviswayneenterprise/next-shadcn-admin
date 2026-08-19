'use client'

import { HTMLAttributes, useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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

type OtpFormProps = HTMLAttributes<HTMLDivElement>

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter your email' })
    .email({ message: 'Invalid email address' }),
  token: z
    .string()
    .min(1, { message: 'Please enter the verification code or token.' }),
})

export function OtpForm({ className, ...props }: OtpFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { verifyEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const emailParam = searchParams.get('email') || ''
  const tokenParam = searchParams.get('token') || ''

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: emailParam,
      token: tokenParam,
    },
  })

  useEffect(() => {
    if (emailParam) {
      form.setValue('email', emailParam)
    }
    if (tokenParam) {
      form.setValue('token', tokenParam)
    }
  }, [emailParam, tokenParam, form])

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await verifyEmail({
        email: data.email,
        token: data.token,
      })

      if (!result.success) {
        setErrorMessage(result.error || 'Verification failed. The token may be invalid or expired.')
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: result.error || 'Invalid or expired verification token.',
        })
        setIsLoading(false)
        return
      }

      toast({
        title: 'Email Verified Successfully!',
        description: 'Your account is active. You can now log in.',
      })

      router.push('/auth/sign-in')
    } catch {
      setErrorMessage('An unexpected error occurred during verification.')
      toast({
        variant: 'destructive',
        title: 'Verification Error',
        description: 'Unable to connect to the server. Please try again.',
      })
      setIsLoading(false)
    }
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
          <div className='grid gap-3'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='name@example.com'
                      autoComplete='email'
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='token'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Verification Token / Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Paste your verification token'
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className='mt-2' type='submit' disabled={isLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Verify Account
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
