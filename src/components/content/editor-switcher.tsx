import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"

type EditorKey = "classic" | "editor-x" | "editor-tiptap"

const SCHEMA_VERSION_TO_KEY: Record<number, EditorKey> = { 1: "classic", 2: "editor-x", 3: "editor-tiptap" }

export function EditorSwitcher({
  versionId,
  active,
  activeSchemaVersion,
}: {
  versionId: string
  active: EditorKey
  /** Which editor's slot Publish/Classic-view currently reads from - shown as a small "Active" marker so switching editors doesn't lose track of which one is authoritative. */
  activeSchemaVersion?: number
}) {
  const activeKey = activeSchemaVersion ? SCHEMA_VERSION_TO_KEY[activeSchemaVersion] : undefined
  const editors: { key: EditorKey; label: string }[] = [
    { key: "classic", label: "Classic" },
    { key: "editor-x", label: "Editor X" },
    { key: "editor-tiptap", label: "Tiptap" },
  ]

  function label(editor: { key: EditorKey; label: string }) {
    return editor.key === activeKey ? `${editor.label} · Active` : editor.label
  }

  return (
    <ButtonGroup>
      {editors.map((editor) => {
        if (editor.key === active) {
          return (
            <Button key={editor.key} size="sm" variant="secondary" disabled>
              {label(editor)}
            </Button>
          )
        }
        if (editor.key === "classic") {
          return (
            <Button
              key={editor.key}
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href={`/content/lesson-versions/${versionId}`} />}
            >
              {label(editor)}
            </Button>
          )
        }
        if (editor.key === "editor-x") {
          return (
            <Button
              key={editor.key}
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href={`/content/lesson-versions/${versionId}/editor-x`} />}
            >
              {label(editor)}
            </Button>
          )
        }
        return (
          <Button
            key={editor.key}
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href={`/content/lesson-versions/${versionId}/editor-tiptap`} />}
          >
            {label(editor)}
          </Button>
        )
      })}
    </ButtonGroup>
  )
}
