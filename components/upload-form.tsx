"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ZONE_MAPPING } from "@/lib/zones"

export interface user {
  email: string
  role: string
  branch?: string
  zone?: string
}

interface UploadFormProps {
  user: user
  onSuccess: () => void
}

export function UploadForm({ user, onSuccess }: UploadFormProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [message, setMessage] = useState("")
  const [branch, setBranch] = useState<string | null>(null)
  const [zone, setZone] = useState<string | null>(null)
  const [year, setYear] = useState<string>(new Date().getFullYear().toString())
  const [docType, setDocType] = useState<string>("type1")
  const [fileType, setFileType] = useState<string>("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles: File[] = []
    let errorMessage = ""
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
      "image/tiff",
      "image/svg+xml",
      "image/heif",
      "image/heic",
      "image/x-icon",
    ]

    selectedFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        errorMessage = `File ${file.name} must be a PDF or an image (JPEG, PNG, GIF, BMP, WebP, TIFF, SVG, HEIF, HEIC, ICO).`
        return
      }
      if (file.size > 100 * 1024 * 1024) {
        // 100MB limit
        errorMessage = `File ${file.name} exceeds 100MB limit.`
        return
      }
      validFiles.push(file)

      // Set file type based on the first file's type
      if (validFiles.length === 1) {
        const type = file.type.split('/')[1] || file.name.split('.').pop()?.toLowerCase() || 'unknown'
        setFileType(type)
      }
    })

    if (errorMessage) {
      setMessage(errorMessage)
      setFiles([])
    } else {
      setFiles(validFiles)
      setMessage("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    setMessage("")

    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`file${index}`, file)
      })

      // Add metadata fields
      formData.append("year", year)
      formData.append("type", docType)
      formData.append("filetype", fileType)

      if (user.role === "admin") {
        formData.append("branch", branch ?? "")
        formData.append("zone", zone ?? "")
      } else {
        formData.append("branch", user.branch ?? "")
        formData.append("zone", user.zone ?? "")
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setMessage(`${files.length} file(s) uploaded successfully!`)
        setFiles([])
        onSuccess()
        // Reset file input
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      } else {
        const error = await response.text()
        setMessage(`Upload failed: ${error}`)
      }
    } catch (error) {
      setMessage("Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Generate years from 2000 to current year + 5
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => (currentYear - 10 + i).toString())

  return (
    <div className="mb-80 space-y-6">
      {user.role === "admin" ? (
        <div className="flex gap-5 w-full">
          <div className="space-y-2 w-full">
            <Label htmlFor="zone">Zone</Label>
            <Select
              onValueChange={(value) => {
                setZone(value)
                setBranch(null)
              }}
            >
              <SelectTrigger id="zone">
                <SelectValue placeholder="Select Zone" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(ZONE_MAPPING).map((zoneName) => (
                  <SelectItem key={zoneName} value={zoneName}>
                    {zoneName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 w-full">
            <Label htmlFor="branch">Branch</Label>
            <Select onValueChange={(value) => setBranch(value)} disabled={!zone}>
              <SelectTrigger id="branch">
                <SelectValue placeholder={zone ? "Select Branch" : "Select Zone First"} />
              </SelectTrigger>
              <SelectContent>
                {zone &&
                  ZONE_MAPPING[zone as keyof typeof ZONE_MAPPING].map((branchName) => (
                    <SelectItem key={branchName} value={branchName}>
                      {branchName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">You are uploading as a user.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Select onValueChange={setYear} value={year}>
            <SelectTrigger id="year">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="docType">Document Type</Label>
          <Select onValueChange={setDocType} value={docType}>
            <SelectTrigger id="docType">
              <SelectValue placeholder="Select Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="type1">Type 1</SelectItem>
              <SelectItem value="type2">Type 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fileType">File Type</Label>
          <Input
            id="fileType"
            type="text"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            placeholder="File type will be auto-detected"
            readOnly
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select PDF or Image Files</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".pdf,image/jpeg,image/png,image/gif,image/bmp,image/webp,image/tiff,image/svg+xml,image/heif,image/heic,image/x-icon"
            multiple
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-sm text-gray-600">Encrypting and uploading...</p>
          </div>
        )}

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={files.length === 0 || isUploading} className="w-full">
          {isUploading ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload {files.length} File{files.length > 1 ? "s" : ""}
            </>
          )}
        </Button>
      </form>
    </div>
  )
}