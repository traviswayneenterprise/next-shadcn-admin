import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/current-session'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { prisma } from '@/lib/db'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  if (!session) {
    redirect('/auth/sign-in')
  }

  // Fetched once here (a layout, not a page) rather than per-page, so the
  // sidebar's Content dropdown doesn't re-query on every navigation within
  // the dashboard.
  const tracks = await prisma.track.findMany({
    where: { archivedAt: null },
    orderBy: { title: 'asc' },
    select: { id: true, title: true },
  })

  return <DashboardShell tracks={tracks}>{children}</DashboardShell>
}
