'use server'

import { Task } from './data/schema'

// This starter-kit demo feature has no LMS domain equivalent (no Task model
// in prisma/schema.prisma, no /api/v1 route) and previously seeded 100
// faker-generated rows into a module-level array on every server start,
// which also does not persist correctly across serverless invocations. Per
// the Week 1 baseline audit's own component decision ("Remove or isolate:
// demo chats/tasks, fake mutations ... false affordances are unsafe in an
// authoritative staff application"), reads now return no rows and writes
// fail honestly instead of pretending to succeed against fake in-memory
// state. Replace this whole feature with real Track/Course/curriculum
// management, or remove the /tasks route entirely, when that domain lands.

export async function getTasks(): Promise<Task[]> {
  return []
}

export async function createTask(formData: FormData): Promise<never> {
  void formData
  throw new Error('Task management is not implemented yet.')
}

export async function updateTask(taskId: string, formData: FormData): Promise<never> {
  void taskId
  void formData
  throw new Error('Task management is not implemented yet.')
}

export async function deleteTask(taskId: string): Promise<never> {
  void taskId
  throw new Error('Task management is not implemented yet.')
}
