'use server'

import { User } from './data/schema'
import { users } from './data/users'

// This is starter-kit demo scaffolding: `users` here is a static in-memory
// array, not the authoritative Prisma User model, and there is no
// /api/v1 staff-user-administration endpoint yet (staff RBAC is planned but
// unimplemented). Per the Week 1 baseline audit's own component decision
// ("false affordances are unsafe in an authoritative staff application"),
// the read below still shows placeholder rows for layout/testing, but writes
// fail honestly instead of mutating an array that will not persist across
// requests or deployments. Wire these to real backend endpoints when staff
// user administration is implemented.

export async function getUsers(): Promise<User[]> {
  return users
}

export async function createUser(formData: FormData): Promise<never> {
  void formData
  throw new Error('User administration is not implemented yet.')
}

export async function updateUser(id: string, formData: FormData): Promise<never> {
  void id
  void formData
  throw new Error('User administration is not implemented yet.')
}

export async function deleteUser(id: string): Promise<never> {
  void id
  throw new Error('User administration is not implemented yet.')
}

export async function inviteUser(formData: FormData): Promise<never> {
  void formData
  throw new Error('User administration is not implemented yet.')
}
