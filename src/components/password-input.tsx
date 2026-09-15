'use client'

import * as React from 'react'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
>

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    return (
      <div className={cn('relative rounded-md', className)}>
        <Input
          type={showPassword ? 'text' : 'password'}
          className='pr-9'
          ref={ref}
          disabled={disabled}
          {...props}
        />
        <Button
          type='button'
          size='icon-sm'
          variant='ghost'
          disabled={disabled}
          className='absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground'
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? <IconEye size={18} /> : <IconEyeOff size={18} />}
        </Button>
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
