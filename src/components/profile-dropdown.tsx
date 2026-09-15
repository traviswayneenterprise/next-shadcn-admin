'use client'

import Link from 'next/link'
import { LogOut, User, Settings, CreditCard } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/hooks/use-auth'

export function ProfileDropdown() {
  const { user, logout } = useAuth()

  const displayName = user?.name || 'Learner'
  const displayEmail = user?.email || ''
  const displayAvatar = user?.image || ''
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger render={<Button variant='ghost' className='relative h-8 w-8 rounded-full' />}>
        <Avatar className='h-8 w-8'>
          <AvatarImage src={displayAvatar} alt={displayName} />
          <AvatarFallback className='bg-primary/10 text-primary font-semibold text-xs'>
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end'>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm font-medium leading-none'>{displayName}</p>
              <p className='text-xs leading-none text-muted-foreground'>
                {displayEmail}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href='/settings' className='flex items-center cursor-pointer' />}>
            <User className='mr-2 h-4 w-4' />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href='/settings/account' className='flex items-center cursor-pointer' />}>
            <Settings className='mr-2 h-4 w-4' />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className='text-destructive focus:text-destructive cursor-pointer'
        >
          <LogOut className='mr-2 h-4 w-4' />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
