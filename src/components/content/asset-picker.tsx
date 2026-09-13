"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getCsrfHeaders } from "@/lib/auth/csrf-client"

type Asset = { id: string; originalName: string; url: string }

export function AssetPicker({
  selectedAssetId,
  disabled,
  onSelect,
}: {
  selectedAssetId: string
  disabled: boolean
  onSelect: (assetId: string) => void
}) {
  const { toast } = useToast()
  const [assets, setAssets] = useState<Asset[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetch("/api/v1/content/assets")
      .then((response) => response.json())
      .then((body) => setAssets(body.data ?? []))
      .catch(() => undefined)
  }, [])

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const form = new FormData()
    form.append("file", file)
    try {
      const response = await fetch("/api/v1/content/assets", { method: "POST", headers: getCsrfHeaders(), body: form })
      const body = await response.json()
      if (!response.ok) {
        toast({ title: "Upload failed", description: body.error?.message, variant: "destructive" })
        return
      }
      setAssets((prev) => [body.data, ...prev])
      onSelect(body.data.id)
      toast({ title: "Asset uploaded" })
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedAssetId || undefined} onValueChange={(value) => value && onSelect(value)} disabled={disabled || assets.length === 0}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder={assets.length === 0 ? "No assets yet" : "Select an asset"} />
        </SelectTrigger>
        <SelectContent>
          {assets.map((asset) => (
            <SelectItem key={asset.id} value={asset.id}>{asset.originalName}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" disabled={disabled || isUploading} nativeButton={false} render={<label />}>
        {isUploading ? "Uploading..." : "Upload"}
        <input type="file" className="hidden" onChange={handleUpload} disabled={disabled || isUploading} />
      </Button>
    </div>
  )
}
