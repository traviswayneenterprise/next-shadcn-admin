"use client"

import { useState } from "react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SIMPLE_BLOCK_TYPES } from "@/components/content/block-defaults"
import { AssetPicker } from "@/components/content/asset-picker"

type Block = { id: string; version: number; type: string; data: unknown }

export function BlockForm({ block, disabled, onChange }: { block: Block; disabled: boolean; onChange: (next: Block) => void }) {
  function setData(data: unknown) {
    onChange({ ...block, data })
  }

  if (!SIMPLE_BLOCK_TYPES.includes(block.type as never)) {
    return <RawJsonForm block={block} disabled={disabled} onChange={onChange} />
  }

  const data = (block.data ?? {}) as Record<string, unknown>

  switch (block.type) {
    case "heading":
      return (
        <div className="flex gap-2">
          <Select
            value={String(data.level ?? 2)}
            onValueChange={(value) => setData({ ...data, level: Number(value) })}
            disabled={disabled}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 4].map((level) => (
                <SelectItem key={level} value={String(level)}>H{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={String(data.text ?? "")}
            disabled={disabled}
            onChange={(event) => setData({ ...data, text: event.target.value })}
            placeholder="Heading text"
          />
        </div>
      )
    case "paragraph": {
      const text = ((data.richText as { text?: string }[]) ?? [])[0]?.text ?? ""
      return (
        <Textarea
          value={text}
          disabled={disabled}
          onChange={(event) => setData({ richText: [{ text: event.target.value }] })}
          placeholder="Paragraph text"
        />
      )
    }
    case "list": {
      const items = ((data.items as { richText?: { text?: string }[] }[]) ?? [])
        .map((item) => item.richText?.[0]?.text ?? "")
        .join("\n")
      return (
        <div className="space-y-2">
          <Select
            value={String(data.style ?? "unordered")}
            onValueChange={(value) => setData({ ...data, style: value })}
            disabled={disabled}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unordered">Bulleted</SelectItem>
              <SelectItem value="ordered">Numbered</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={items}
            disabled={disabled}
            onChange={(event) =>
              setData({
                ...data,
                items: event.target.value.split("\n").map((line) => ({ richText: [{ text: line }] })),
              })
            }
            placeholder="One item per line"
          />
        </div>
      )
    }
    case "code":
      return (
        <div className="space-y-2">
          <Input
            value={String(data.language ?? "")}
            disabled={disabled}
            onChange={(event) => setData({ ...data, language: event.target.value })}
            placeholder="Language (e.g. html, javascript)"
          />
          <Textarea
            value={String(data.code ?? "")}
            disabled={disabled}
            onChange={(event) => setData({ ...data, code: event.target.value })}
            placeholder="Code"
            className="font-mono text-xs"
            rows={8}
          />
        </div>
      )
    case "callout":
      return (
        <div className="space-y-2">
          <Select
            value={String(data.tone ?? "info")}
            onValueChange={(value) => setData({ ...data, tone: value })}
            disabled={disabled}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["info", "success", "warning", "danger"].map((tone) => (
                <SelectItem key={tone} value={tone}>{tone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={String(data.body ?? "")}
            disabled={disabled}
            onChange={(event) => setData({ ...data, body: event.target.value })}
            placeholder="Callout text"
          />
        </div>
      )
    case "image":
      return (
        <div className="space-y-2">
          <AssetPicker
            disabled={disabled}
            selectedAssetId={String(data.assetId ?? "")}
            onSelect={(assetId) => setData({ ...data, assetId })}
          />
          <Input
            value={String(data.alt ?? "")}
            disabled={disabled}
            onChange={(event) => setData({ ...data, alt: event.target.value })}
            placeholder="Alt text"
          />
        </div>
      )
    case "divider":
      return <p className="text-xs text-muted-foreground">No fields - renders a horizontal rule.</p>
    default:
      return null
  }
}

function RawJsonForm({ block, disabled, onChange }: { block: Block; disabled: boolean; onChange: (next: Block) => void }) {
  const [text, setText] = useState(() => JSON.stringify(block.data, null, 2))
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">
        No dedicated form for &quot;{block.type}&quot; yet - edit its data as JSON.
      </p>
      <Textarea
        value={text}
        disabled={disabled}
        rows={6}
        className="font-mono text-xs"
        onChange={(event) => {
          setText(event.target.value)
          try {
            const parsed = JSON.parse(event.target.value)
            setError(null)
            onChange({ ...block, data: parsed })
          } catch {
            setError("Invalid JSON")
          }
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
