"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, AlertCircle, AlertTriangleIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface User {
  email: string
  role: string
  branch?: string
  zone?: string
}

interface UploadFormProps {
  user: User
  onSuccess: () => void
  zoneMapping: Record<string, string[]>
  docType: string[] | null
}

type FormErrors = {
  zone?: string
  branch?: string
  year?: string
  docType?: string
  files?: string
}

export function UploadForm({ user, onSuccess, zoneMapping, docType }: UploadFormProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null)
  const [zone, setZone] = useState<string | null>(
    user.role === "zonal_head" || user.role === "admin" ? user.zone || null : null
  )

  const [branch, setBranch] = useState<string | null>(
    user.role === "zonal_head" || user.role === "admin" ? user.branch || null : null
  )

  const [year, setYear] = useState<string>(new Date().getFullYear().toString())
  const [docTypeLocal, setDocTypeLocal] = useState<string>(docType?.[0] ?? '')
  const [fileType, setFileType] = useState<string>("")
  const [errors, setErrors] = useState<FormErrors>({})

  // Generate years from current year -10 to +5
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 16 }, (_, i) => (currentYear - 10 + i).toString())

  // Validate form whenever fields change
  useEffect(() => {
    validateForm()
  }, [zone, branch, year, docTypeLocal, files, user.role])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (user.role === "admin") {
      if (!zone) newErrors.zone = "Zone is required"
      if (!branch) newErrors.branch = "Branch is required"
    }

    if (!year) newErrors.year = "Year is required"
    if (!docTypeLocal) newErrors.docType = "Document type is required"
    if (files.length === 0) newErrors.files = "At least one file is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles: File[] = []
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

    // Clear previous messages
    setMessage(null)

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setMessage({
          text: `File ${file.name} must be a PDF or an image (JPEG, PNG, GIF, BMP, WebP, TIFF, SVG, HEIF, HEIC, ICO).`,
          type: 'error'
        })
        continue
      }

      if (file.size > 100 * 1024 * 1024) {
        setMessage({
          text: `File ${file.name} exceeds 100MB limit.`,
          type: 'error'
        })
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      setFiles(validFiles)
      // Set file type based on the first file's type
      const type = validFiles[0].type.split('/')[1] ||
        validFiles[0].name.split('.').pop()?.toLowerCase() ||
        'unknown'
      setFileType(type)
    } else {
      setFiles([])
      setFileType("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setMessage({
        text: "Please fix all errors before uploading",
        type: 'error'
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setMessage(null)

    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`file${index}`, file)
      })

      // Add metadata fields
      formData.append("year", year)
      formData.append("type", docTypeLocal)
      formData.append("filetype", fileType)

      if (user.role === "admin") {
        formData.append("branch", branch!)
        formData.append("zone", zone!)
      }
      else if (user.role === "zonal_head") {

        formData.append("branch", branch!)
        formData.append("zone", zone!)
      }
      else {
        formData.append("branch", user.branch || "")
        formData.append("zone", user.zone || "")
      }

      // Simulate progress for demo (replace with actual upload progress)
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return prev
          }
          return prev + 10
        })
      }, 300)

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(interval)
      setUploadProgress(100)

      if (response.ok) {
        setMessage({
          text: `${files.length} file(s) uploaded successfully!`,
          type: 'success'
        })
        setFiles([])
        setFileType("")
        // Reset file input
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
        onSuccess()
      } else {
        const error = await response.text()
        setMessage({
          text: `Upload failed: ${error}`,
          type: 'error'
        })
      }
    } catch (error) {
      setMessage({
        text: "Upload failed. Please try again.",
        type: 'error'
      })
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  return (
    <div className="space-y-6 mb-20">
      <p className="text-sm text-muted-foreground">
        {(user.role === "admin" || user.role === "zonal_head") ?
          "You are uploading as an administrator" :
          `You are uploading to ${user.branch || 'your branch'} in ${user.zone || 'your zone'}`}
      </p>

      {(user.role === "admin" || user.role === "zonal_head") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zone">Zone *</Label>
            <Select
              value={zone || ""}
              onValueChange={(value) => {
                setZone(value)
                setBranch(null)
              }}
              disabled={user.role === "zonal_head"} // Disable for zonal head
            >
              <SelectTrigger id="zone" className={errors.zone ? "border-destructive" : ""}>
                <SelectValue placeholder="Select Zone" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(zoneMapping).map((zoneName) => (
                  <SelectItem key={zoneName} value={zoneName}>
                    {zoneName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.zone && (
              <p className="text-sm font-medium text-destructive">{errors.zone}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch">Branch *</Label>
            <Select
              value={branch || ""}
              onValueChange={setBranch}
              disabled={!zone}
            >
              <SelectTrigger id="branch" className={errors.branch ? "border-destructive" : ""}>
                <SelectValue placeholder={zone ? "Select Branch" : "Select Zone First"} />
              </SelectTrigger>
              <SelectContent>
                {zone &&
                  zoneMapping[zone]?.map((branchName) => (
                    <SelectItem key={branchName} value={branchName}>
                      {branchName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.branch && (
              <p className="text-sm font-medium text-destructive">{errors.branch}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year *</Label>
          <Select
            value={year}
            onValueChange={setYear}
          >
            <SelectTrigger id="year" className={errors.year ? "border-destructive" : ""}>
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
          {errors.year && (
            <p className="text-sm font-medium text-destructive">{errors.year}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="docTypeLocal">Document Type *</Label>
          <Select
            value={docTypeLocal}
            onValueChange={setDocTypeLocal}
          >
            <SelectTrigger id="docTypeLocal" className={errors.docType ? "border-destructive" : ""}>
              <SelectValue placeholder="Select Document Type" />
            </SelectTrigger>
            <SelectContent>
              {docType ? (
                docType.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="Default">Default</SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.docType && (
            <p className="text-sm font-medium text-destructive">{errors.docType}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fileType">File Type</Label>
          <Input
            id="fileType"
            type="text"
            value={fileType}
            readOnly
            className="bg-muted"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Files *</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,image/*"
              multiple
              onChange={handleFileChange}
              disabled={isUploading}
              className={errors.files ? "border-destructive" : ""}
            />
          </div>
          {errors.files && (
            <p className="text-sm font-medium text-destructive">{errors.files}</p>
          )}

          {files.length > 0 && (
            <div className="space-y-2 mt-2">
              <div className="text-sm text-muted-foreground">
                Selected {files.length} file{files.length !== 1 ? 's' : ''}
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm p-1 hover:bg-muted rounded">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate flex-grow">{file.name}</span>
                    <span className="text-muted-foreground text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-sm text-muted-foreground">
              {uploadProgress < 100 ? "Uploading..." : "Finalizing..."}
            </p>
          </div>
        )}

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'error' ? (
              <AlertTriangleIcon className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{message.type === 'error' ? 'Error' : message.type === 'success' ? 'Success' : 'Notice'}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isUploading || Object.keys(errors).length > 0 || files.length === 0}
          className="w-full"
        >
          {isUploading ? (
            <>
              <span className="animate-pulse">Uploading</span>
              <span className="ml-2">{uploadProgress}%</span>
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload {files.length} File{files.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </form>
    </div>
  )
}