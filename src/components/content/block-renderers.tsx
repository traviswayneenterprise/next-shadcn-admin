"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"

type TextSpan = { text: string; marks?: string[] }
type LinkSpan = { type: "link"; href: string; children: TextSpan[] }
type Block = { id: string; version: number; type: string; data: unknown }

function RichText({ spans }: { spans: (TextSpan | LinkSpan)[] }) {
  return (
    <>
      {spans.map((span, index) => {
        if ("type" in span && span.type === "link") {
          return (
            <a key={index} href={span.href} className="text-primary underline underline-offset-2">
              {span.children.map((child) => child.text).join("")}
            </a>
          )
        }
        const textSpan = span as TextSpan
        let node: React.ReactNode = textSpan.text
        if (textSpan.marks?.includes("code")) node = <code className="rounded bg-muted px-1 py-0.5 text-xs">{node}</code>
        if (textSpan.marks?.includes("bold")) node = <strong>{node}</strong>
        if (textSpan.marks?.includes("italic")) node = <em>{node}</em>
        return <span key={index}>{node}</span>
      })}
    </>
  )
}

function ImagePreview({ assetId, alt }: { assetId: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/v1/content/assets")
      .then((response) => response.json())
      .then((body) => {
        if (cancelled) return
        const asset = (body.data as { id: string; url: string }[] | undefined)?.find((a) => a.id === assetId)
        setUrl(asset?.url ?? null)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [assetId])

  if (!url) return <p className="text-xs text-muted-foreground">Loading image ({assetId})...</p>
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className="max-w-full rounded-md" />
}

export function BlockRenderer({ block }: { block: Block }) {
  const data = (block.data ?? {}) as Record<string, unknown>

  switch (block.type) {
    case "heading": {
      const level = Number(data.level ?? 2)
      const className = level === 2 ? "text-xl font-semibold" : level === 3 ? "text-lg font-semibold" : "text-base font-semibold"
      return <p className={className}>{String(data.text ?? "")}</p>
    }
    case "paragraph":
      return <p className="text-sm leading-relaxed"><RichText spans={(data.richText as (TextSpan | LinkSpan)[]) ?? []} /></p>
    case "list": {
      const Tag = data.style === "ordered" ? "ol" : "ul"
      const items = (data.items as { richText: (TextSpan | LinkSpan)[]; children?: { richText: (TextSpan | LinkSpan)[] }[] }[]) ?? []
      return (
        <Tag className={data.style === "ordered" ? "list-decimal pl-5 text-sm" : "list-disc pl-5 text-sm"}>
          {items.map((item, index) => (
            <li key={index}>
              <RichText spans={item.richText} />
              {item.children && item.children.length > 0 && (
                <ul className="list-disc pl-5">
                  {item.children.map((child, childIndex) => (
                    <li key={childIndex}><RichText spans={child.richText} /></li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </Tag>
      )
    }
    case "table": {
      const headers = (data.headers as (TextSpan | LinkSpan)[][]) ?? []
      const rows = (data.rows as (TextSpan | LinkSpan)[][][]) ?? []
      return (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>{headers.map((cell, index) => <th key={index} className="border p-2 text-left font-medium"><RichText spans={cell} /></th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border p-2"><RichText spans={cell} /></td>)}</tr>
            ))}
          </tbody>
        </table>
      )
    }
    case "code":
      return (
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
          <code>{String(data.code ?? "")}</code>
        </pre>
      )
    case "callout": {
      const toneClass: Record<string, string> = {
        info: "border-blue-300 bg-blue-50 dark:bg-blue-950",
        success: "border-green-300 bg-green-50 dark:bg-green-950",
        warning: "border-yellow-300 bg-yellow-50 dark:bg-yellow-950",
        danger: "border-red-300 bg-red-50 dark:bg-red-950",
      }
      return (
        <div className={`rounded-md border p-3 text-sm ${toneClass[String(data.tone)] ?? ""}`}>
          {data.title ? <p className="font-medium">{String(data.title)}</p> : null}
          <p>{String(data.body ?? "")}</p>
        </div>
      )
    }
    case "image":
      return data.assetId ? (
        <ImagePreview assetId={String(data.assetId)} alt={String(data.alt ?? "")} />
      ) : (
        <p className="text-xs text-muted-foreground">No asset selected.</p>
      )
    case "divider":
      return <hr className="border-t" />
    case "reusableSnapshot": {
      const nested = (data.blocks as Block[]) ?? []
      return (
        <div className="space-y-2 rounded-md border border-dashed p-3">
          <Badge variant="outline">reusable content</Badge>
          {nested.map((nestedBlock) => <BlockRenderer key={nestedBlock.id} block={nestedBlock} />)}
        </div>
      )
    }
    case "video":
      return (
        <a href={String(data.url ?? "")} target="_blank" rel="noreferrer" className="text-sm text-primary underline underline-offset-2">
          {String(data.title ?? "Watch video")}
        </a>
      )
    case "file":
      return (
        <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
          <Badge variant="outline">file</Badge>
          <span>{String(data.label ?? "Download")}</span>
        </div>
      )
    case "embed":
      return (
        <div className="overflow-hidden rounded-md border">
          <iframe src={String(data.url ?? "")} title={String(data.title ?? "Embedded content")} className="h-64 w-full" sandbox="allow-scripts" />
        </div>
      )
    case "lab":
      return (
        <div className="rounded-md border p-3 text-sm">
          <Badge variant="secondary">interactive lab</Badge>
          <p className="mt-1">{String(data.title ?? "Lab")}</p>
          <p className="text-xs text-muted-foreground">Renders in a sandboxed iframe on a dedicated lab origin (Thursday).</p>
        </div>
      )
    case "quiz":
      return <Badge variant="outline">Quiz reference: {String(data.quizId ?? "")}</Badge>
    case "assignment":
      return <Badge variant="outline">Assignment reference: {String(data.assignmentId ?? "")}</Badge>
    case "submissionPrompt":
      return (
        <div className="rounded-md border border-dashed p-3 text-sm">
          <Badge variant="outline">submission prompt</Badge>
          <p className="mt-1">{String(data.prompt ?? "")}</p>
        </div>
      )
    case "projectBrief": {
      const links = (data.links as { label: string; href: string }[]) ?? []
      return (
        <div className="space-y-2 rounded-md border p-3">
          <p className="font-medium">{String(data.title ?? "")}</p>
          <p className="text-sm">{String(data.body ?? "")}</p>
          {links.length > 0 && (
            <ul className="list-disc pl-5 text-sm">
              {links.map((link, index) => (
                <li key={index}><a href={link.href} className="text-primary underline underline-offset-2">{link.label}</a></li>
              ))}
            </ul>
          )}
        </div>
      )
    }
    case "columns": {
      const columns = (data.columns as Block[][]) ?? []
      return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length || 1}, minmax(0, 1fr))` }}>
          {columns.map((column, index) => (
            <div key={index} className="space-y-2">
              {column.map((block) => <BlockRenderer key={block.id} block={block} />)}
            </div>
          ))}
        </div>
      )
    }
    case "tabs": {
      const tabItems = (data.tabs as { id: string; label: string; blocks: Block[] }[]) ?? []
      return (
        <div className="space-y-2 rounded-md border p-3">
          {tabItems.map((tab) => (
            <div key={tab.id}>
              <p className="text-sm font-medium">{tab.label}</p>
              <div className="space-y-2 pl-2">{tab.blocks.map((block) => <BlockRenderer key={block.id} block={block} />)}</div>
            </div>
          ))}
        </div>
      )
    }
    case "accordion": {
      const items = (data.items as { id: string; title: string; blocks: Block[] }[]) ?? []
      return (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border p-3">
              <p className="text-sm font-medium">{item.title}</p>
              <div className="space-y-2 pl-2">{item.blocks.map((block) => <BlockRenderer key={block.id} block={block} />)}</div>
            </div>
          ))}
        </div>
      )
    }
    default:
      return (
        <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          Preview not yet implemented for &quot;{block.type}&quot; blocks.
        </div>
      )
  }
}
