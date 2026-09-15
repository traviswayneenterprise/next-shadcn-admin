'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '../ui/sidebar'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { sidebarData } from './data/sidebar-data'
import type { NavGroup as NavGroupType } from './types'

export function AppSidebar({
  tracks,
  ...props
}: React.ComponentProps<typeof Sidebar> & { tracks?: { id: string; title: string }[] }) {
  // The static "Content" nav entry becomes an expandable dropdown listing
  // Tracks (fetched once at the dashboard layout level - see
  // (dashboard)/layout.tsx - not re-queried per page) so any Track is one
  // click away from anywhere in the app, instead of always routing through
  // the /content list first.
  const navGroups: NavGroupType[] = sidebarData.navGroups.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.title === 'Content'
        ? {
            title: 'Content',
            icon: item.icon,
            items: [
              { title: 'All tracks', url: '/content' },
              ...(tracks ?? []).map((track) => ({
                title: track.title,
                url: `/content/tracks/${track.id}`,
              })),
            ],
          }
        : item,
    ),
  }))

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((groupProps) => (
          <NavGroup key={groupProps.title} {...groupProps} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
