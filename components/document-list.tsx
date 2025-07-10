"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, FileText, Eye, Trash2 } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface Document {
  id: string
  filename: string
  originalFilename: string
  branch: string
  zone: string
  uploadedAt: string
  uploadedBy: {
    email: string
  }
  fileType: string
}

interface DocumentListProps {
  documents: Document[]
  searchQuery: string
  isLoading: boolean
  user: any
  onDocumentDeleted?: (documentId: string) => void
}

export function DocumentList({ documents, searchQuery, isLoading, user, onDocumentDeleted }: DocumentListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const filteredDocuments = documents.filter((doc) =>
    doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Download started successfully")
      } else {
        toast.error("Failed to download document")
      }
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Download failed")
    } finally {
      setDownloadingId(null)
    }
  }

  const handlePreview = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (!response.ok) {
        toast.error("Failed to load document preview")
        return
      }

      const blob = await response.blob()
      const fileURL = window.URL.createObjectURL(blob)

      // Open in new tab
      const newTab = window.open()
      if (newTab) {
        newTab.location.href = fileURL
        setIsPreviewOpen(true) // Update state if needed for UI indication
      } else {
        // Fallback if pop-up is blocked
        toast.error("Popup blocked — please allow popups for preview")
      }
    } catch (error) {
      console.error("Preview failed:", error)
      toast.error("Preview failed")
    }
  }


  const handleDelete = async (documentId: string) => {
    setDeletingId(documentId)
    try {
      const response = await fetch(`/api/documents/delete/${documentId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Document deleted successfully")
        if (onDocumentDeleted) {
          onDocumentDeleted(documentId)
        }
      } else {
        toast.error("Failed to delete document")
      }
    } catch (error) {
      console.error("Delete failed:", error)
      toast.error("Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <div>
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (filteredDocuments.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium ">No documents found</h3>
        <p className="mt-1 text-sm ">
          {searchQuery ? "Try adjusting your search terms." : "Upload your first document to get started."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
            <DialogDescription>
              Previewing: {previewUrl && (() => {
                const fileName = previewUrl.split('/').pop() || '';
                const doc = documents.find(d => d.filename.includes(fileName));
                return doc ? doc.originalFilename : '';
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="h-full w-full flex items-center justify-center">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border rounded-md"
                title="Document Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Documents List */}
      {filteredDocuments.map((document) => (
        <Card key={document.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${document.fileType === 'pdf' ? 'bg-red-50 text-red-600' :
                  document.fileType === 'docx' ? 'bg-blue-50 text-blue-600' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-medium ">{document.originalFilename}</h3>
                  <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                    <Badge variant="outline" className="text-xs">
                      {document.branch || document.zone}
                    </Badge>
                    <span className="text-xs ">
                      Uploaded by {document.uploadedBy.email}
                    </span>
                    <span className="text-xs ">
                      {format(new Date(document.uploadedAt), "MMM d, yyyy")}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {document.fileType}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(document.id)}
                  className="gap-1"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Preview</span>
                </Button>

                <Button
                  onClick={() => handleDownload(document.id)}
                  disabled={downloadingId === document.id}
                  size="sm"
                  className="gap-1"
                >
                  {downloadingId === document.id ? (
                    "Downloading..."
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </>
                  )}
                </Button>

                {
                  user && user.role === 'admin' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you sure absolutely sure?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete the document
                            <span className="font-semibold"> {document.originalFilename}</span>.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(document.id)}
                            disabled={deletingId === document.id}
                          >
                            {deletingId === document.id ? "Deleting..." : "Delete Document"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )
                }
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}