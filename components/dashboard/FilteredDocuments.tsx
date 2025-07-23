import React, { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Eye, Trash2, Loader2, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from '../ui/button'
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
import { FilteredDocumentsProps } from './types'


export default function FilteredDocumentsComp({
    filteredDocuments,
    documents,
    onDocumentDeleted,
    user,
    setDocuments
}: FilteredDocumentsProps) {
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [previewingId, setPreviewingId] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [isImage, setImage] = useState(false)
    const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
    const [isloading, setisloading] = useState(false)
    const handleDownload = async (documentId: string) => {
        setisloading(true)
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
            setisloading(false)
        }
    }

    const handlePreview = async (documentId: string) => {
        setPreviewingId(documentId)
        setisloading(true)
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
            setisloading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteDialogId) return
        try {
            setisloading(true)
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
            setisloading(false)
            setDeleteDialogId(null)
        }
    }


    return (
        <>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogHeader className="hidden">
                    <DialogTitle></DialogTitle>
                    <DialogDescription>
                    </DialogDescription>
                </DialogHeader>
                <DialogContent className="max-w-7xl h-[90vh]">
                    <div className="h-full w-full flex items-center justify-center bg-muted/50 p-4 overflow-auto">
                        {previewUrl &&
                            (isImage ? (
                                <ImagePreview previewUrl={previewUrl} onClose={() => setIsPreviewOpen(false)} />
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
                        <Button variant="destructive" onClick={handleDelete} disabled={isloading}>
                            {isloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Delete Document
                                </>
                            )}

                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm font-medium">No documents found</p>
                </div>
            ) : (
                filteredDocuments.map((doc) => (
                    <TooltipProvider key={doc.id}>
                        <Card key={doc.id} className="hover:shadow-md transition-shadow duration-200">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start gap-4">
                                    {/* File Info Section */}
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        {/* File Icon */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className={`p-2.5 flex items-center justify-center rounded-lg flex-shrink-0 ${doc.filetype === 'pdf' ? 'bg-red-50 text-red-600' :
                                                doc.filetype === 'docx' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-gray-50 text-green-600'
                                                }`}>
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                {doc?.filetype.toUpperCase()}
                                            </Badge>
                                        </div>

                                        {/* File Details */}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{doc.originalFilename}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Uploaded by {doc?.uploadedBy?.email} • {format(new Date(doc?.uploadedAt), "MMM d, yyyy")}
                                            </p>

                                            {/* Metadata Badges */}
                                            <div className="flex flex-wrap items-center gap-1.5 mt-2">

                                                {[doc?.year, doc?.zone, doc?.branch || doc.zone, doc?.type].filter(Boolean).map((tag, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs font-normal hover:scale-105">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className=""
                                                    onClick={() => handlePreview(doc.id)}
                                                >
                                                    {previewingId === doc.id ? (
                                                        <div
                                                            className=""
                                                        >

                                                            <Loader2 className="h-4 w-4 animate-spin " />
                                                        </div>
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Preview</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    className=""
                                                    onClick={() => handleDownload(doc.id)}
                                                    disabled={downloadingId === doc.id}
                                                >
                                                    {downloadingId === doc.id ? (
                                                        <div
                                                            className="loading"
                                                        >

                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        </div>
                                                    ) : (
                                                        <Download className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Download</TooltipContent>
                                        </Tooltip>

                                        {user?.role === "admin" && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="icon"
                                                        variant="destructive"
                                                        className=""
                                                        disabled={isloading}
                                                        onClick={() => setDeleteDialogId(doc.id)}
                                                    >
                                                        {isloading ? (
                                                            <div
                                                                className="loading"
                                                            >
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            </div>
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}

                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Delete</TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TooltipProvider>
                ))
            )}
        </>
    )
}
