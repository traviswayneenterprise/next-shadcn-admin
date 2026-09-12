"use client"

import { useMemo, useState, useTransition } from "react"

import { contentBlockSchema } from "@/domain/content/blocks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { BLOCK_TYPES, newBlock, type BlockType } from "@/components/content/block-defaults"
import { BlockForm } from "@/components/content/block-form"
import { BlockRenderer } from "@/components/content/block-renderers"

type Block = { id: string; version: number; type: string; data: unknown }

export function LessonEditor({
  versionId,
  status,
  reviewStatus,
  initialBlocks,
  canPublish,
}: {
  versionId: string
  status: string
  reviewStatus: string
  initialBlocks: unknown
  canPublish: boolean
}) {
  const { toast } = useToast()
  const [blocks, setBlocks] = useState<Block[]>(Array.isArray(initialBlocks) ? (initialBlocks as Block[]) : [])
  const [addType, setAddType] = useState<BlockType>("paragraph")
  const [isPending, startTransition] = useTransition()
  const isDraft = status === "DRAFT"

  const blockErrors = useMemo(() => {
    return blocks.map((block) => {
      const result = contentBlockSchema.safeParse(block)
      return result.success ? null : result.error.issues.map((issue) => issue.message).join("; ")
    })
  }, [blocks])
  const hasErrors = blockErrors.some(Boolean)

  function updateBlock(index: number, next: Block) {
    setBlocks((prev) => prev.map((block, i) => (i === index ? next : block)))
  }
  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index))
  }
  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }
  function addBlock() {
    setBlocks((prev) => [...prev, newBlock(addType)])
  }

  function save() {
    startTransition(async () => {
      const response = await fetch(`/api/v1/content/lesson-versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      })
      const body = await response.json()
      if (response.ok) {
        toast({ title: "Draft saved" })
      } else {
        toast({ title: "Save failed", description: body.error?.message, variant: "destructive" })
      }
    })
  }

  function publish() {
    startTransition(async () => {
      const response = await fetch(`/api/v1/content/lesson-versions/${versionId}/publish`, { method: "POST" })
      const body = await response.json()
      if (response.ok) {
        toast({ title: "Published" })
      } else {
        toast({ title: "Publish failed", description: body.error?.message, variant: "destructive" })
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isDraft ? "outline" : "default"}>{status}</Badge>
        <Badge variant="secondary">{reviewStatus}</Badge>
        {!isDraft && <p className="text-sm text-muted-foreground">Published versions are read-only. Create a new draft to edit.</p>}
      </div>

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          {isDraft && (
            <div className="flex items-center gap-2">
              <Select value={addType} onValueChange={(value) => setAddType(value as BlockType)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={addBlock}>Add block</Button>
            </div>
          )}

          {blocks.map((block, index) => (
            <Card key={block.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{block.type}</CardTitle>
                {isDraft && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => moveBlock(index, -1)} disabled={index === 0}>Up</Button>
                    <Button size="sm" variant="ghost" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}>Down</Button>
                    <Button size="sm" variant="ghost" onClick={() => removeBlock(index)}>Remove</Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <BlockForm block={block} disabled={!isDraft} onChange={(next) => updateBlock(index, next)} />
                {blockErrors[index] && <p className="text-xs text-destructive">{blockErrors[index]}</p>}
              </CardContent>
            </Card>
          ))}

          {isDraft && (
            <div className="flex items-center gap-2">
              <Button onClick={save} disabled={isPending || hasErrors}>Save draft</Button>
              {canPublish && (
                <Button variant="secondary" onClick={publish} disabled={isPending || hasErrors || blocks.length === 0}>
                  Publish
                </Button>
              )}
              {hasErrors && <p className="text-xs text-destructive">Fix validation errors before saving.</p>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview">
          <div className="space-y-4 rounded-lg border p-6">
            {blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
