"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, FileText, Eye, Trash2, Loader2, Filter, X } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import ImagePreview from "./ImagePreview"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "./ui/label"
import { SearchBar } from "./search-bar"

interface Document {
  id: string
  filename: string
  originalFilename: string
  branch: string
  zone: string
  year: string
  type: string
  filetype: string
  uploadedAt: string
  uploadedBy: {
    email: string
  }
}

interface DocumentListProps {
  documents: Document[]
  searchQuery: string
  isLoading: boolean
  user: any
  onDocumentDeleted?: (documentId: string) => void
  setDocuments: (docs: Document[]) => void
  onChange: (value: string) => void
}

export function DocumentList({
  documents,
  searchQuery,
  isLoading,
  user,
  onDocumentDeleted,
  setDocuments,
  onChange,
}: DocumentListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isImage, setImage] = useState(false)
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)

  const [yearFilter, setYearFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all")
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all")

  const years = [...new Set(documents.map((doc) => doc.year))].sort((a, b) => b.localeCompare(a))
  const branches = [...new Set(documents.map((doc) => doc.branch))].sort()
  const docTypes = [...new Set(documents.map((doc) => doc.type))].sort()
  const fileTypes = [...new Set(documents.map((doc) => doc.filetype))].sort()

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesYear = yearFilter === "all" || doc.year === yearFilter
    const matchesBranch = branchFilter === "all" || doc.branch === branchFilter
    const matchesDocType = docTypeFilter === "all" || doc.type === docTypeFilter
    const matchesFileType = fileTypeFilter === "all" || doc.filetype === fileTypeFilter
    return matchesSearch && matchesYear && matchesBranch && matchesDocType && matchesFileType
  })

  const resetFilters = () => {
    setYearFilter("all")
    setBranchFilter("all")
    setDocTypeFilter("all")
    setFileTypeFilter("all")
  }

  const handleDownload = async (documentId: string) => {
    setDownloadingId(documentId)
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const doc = documents.find((d) => d.id === documentId)
        a.download = doc?.originalFilename || "document.pdf"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success("Download started successfully")
      } else {
        toast.error("Failed to download document")
      }
    } catch (err) {
      toast.error("Download failed")
    } finally {
      setDownloadingId(null)
    }
  }

  const handlePreview = async (documentId: string) => {
    setPreviewingId(documentId)
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (!response.ok) {
        toast.error("Failed to load document preview")
        return
      }
      const contentType = response.headers.get("Content-Type") || ""
      const blob = await response.blob()
      const fileURL = URL.createObjectURL(blob)

      setPreviewUrl(fileURL)
      setIsPreviewOpen(true)
      setImage(contentType.startsWith("image/"))
    } catch (err) {
      toast.error("Preview failed")
    } finally {
      setPreviewingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialogId) return
    try {
      const response = await fetch(`/api/documents/delete/${deleteDialogId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Document deleted successfully")
        if (onDocumentDeleted) onDocumentDeleted(deleteDialogId)
        const updated = documents.filter((doc) => doc.id !== deleteDialogId)
        setDocuments(updated)
      } else {
        toast.error("Failed to delete document")
      }
    } catch (err) {
      toast.error("Delete failed")
    } finally {
      setDeleteDialogId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div>
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-7xl h-[90vh]">
          <div className="h-full w-full flex items-center justify-center bg-muted/50 p-4 overflow-auto">
            {previewUrl &&
              (isImage ? (
                <ImagePreview previewUrl={previewUrl} />
              ) : (
                <iframe src={previewUrl} className="w-full h-full rounded shadow" />
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialogId} onOpenChange={() => setDeleteDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <strong>
                {documents.find((d) => d.id === deleteDialogId)?.originalFilename}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex justify-end items-center">
        {(yearFilter !== "all" || branchFilter !== "all" || docTypeFilter !== "all" || fileTypeFilter !== "all") && (
          <Button variant="outline" className="gap-2 text-sm" onClick={resetFilters}>
            <X className="w-4 h-4" />
            Clear filters
          </Button>
        )}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
        {[{ label: "Year", values: years, state: yearFilter, setState: setYearFilter },
        { label: "Branch", values: branches, state: branchFilter, setState: setBranchFilter },
        { label: "Document Type", values: docTypes, state: docTypeFilter, setState: setDocTypeFilter },
        { label: "File Type", values: fileTypes, state: fileTypeFilter, setState: setFileTypeFilter }]
          .map(({ label, values, state, setState }) => (
            <div className="space-y-2" key={label}>
              <Label>{label}</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder={`All ${label.toLowerCase()}s`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {values.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
      </div>
      <div>
        <SearchBar
          value={searchQuery}
          onChange={onChange}
        />
      </div>

      {/* Documents */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400" />
          <p className="mt-2 text-sm font-medium">No documents found</p>
        </div>
      ) : (
        filteredDocuments.map((doc) => (
          <Card key={doc.id} className="hover:shadow transition-shadow">
            <CardContent className="p-4 flex justify-between items-start">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${doc.filetype === 'pdf' ? 'bg-red-50 text-blue-600' : doc.filetype === 'docx' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-green-600'}`}>
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">{doc.originalFilename}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <Badge variant="outline">{doc.branch || doc.zone}</Badge>
                    <Badge variant="outline">{doc.year}</Badge>
                    <Badge variant="outline">{doc.type}</Badge>
                    <span>Uploaded by {doc.uploadedBy.email}</span>
                    <span>{format(new Date(doc.uploadedAt), "MMM d, yyyy")}</span>
                    <Badge variant="secondary">{doc.filetype}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => handlePreview(doc.id)}>
                  {previewingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="sm" onClick={() => handleDownload(doc.id)} disabled={downloadingId === doc.id}>
                  {downloadingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
                {user?.role === "admin" && (
                  <Button size="sm" variant="destructive" onClick={() => setDeleteDialogId(doc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
