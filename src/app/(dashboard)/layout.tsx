import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/current-session'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  if (!session) {
    redirect('/auth/sign-in')
  }

  return <DashboardShell>{children}</DashboardShell>
}
