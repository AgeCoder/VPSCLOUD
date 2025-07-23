"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, AlertCircle, Loader2, AlertTriangle, CheckCircle, Image, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormErrors, UploadFormProps } from "./types"

export function UploadForm({ user, onSuccess, zoneMapping, docType }: UploadFormProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null)
  const [zone, setZone] = useState<string | null>(
    user.role === "zonal_head" || user.role === "admin" ? user.zone || null : null
  )
  const [branch, setBranch] = useState<string | null>(
    user.role === "branch_head" ? user.branch || null : null
  )
  const [year, setYear] = useState<string>(new Date().getFullYear().toString())
  const [docTypeLocal, setDocTypeLocal] = useState<string>(docType?.[0] ?? '')
  const [fileType, setFileType] = useState<string>("")
  const [errors, setErrors] = useState<FormErrors>({})

  const totalSize = useCallback(() => {
    return (files.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)
  }, [files])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 16 }, (_, i) => (currentYear - 10 + i).toString())

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setErrors(validateForm())
    }
  }, [files, zone, branch, year, docTypeLocal])

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    if (user.role === "admin" || user.role === "zonal_head") {
      if (!zone) newErrors.zone = "Zone is required"
      if (!branch && zone) newErrors.branch = "Branch is required"
    }

    if (!year) newErrors.year = "Year is required"
    if (!docTypeLocal) newErrors.docType = "Document type is required"
    if (files.length === 0) newErrors.files = "At least one file is required"

    return newErrors
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    const selectedFiles = Array.from(e.target.files)
    const validFiles: File[] = []
    const allowedTypes = [
      "application/pdf",
      "image/jpeg", "image/png", "image/gif", "image/bmp",
      "image/webp", "image/tiff", "image/svg+xml"
    ]

    setErrors(prev => ({ ...prev, files: undefined }))

    for (const file of selectedFiles) {
      const isAllowedType = allowedTypes.includes(file.type) ||
        file.name.match(/\.(pdf|jpe?g|png|gif|bmp|webp|tiff?|svg)$/i)

      if (!isAllowedType) {
        setMessage({
          text: `${file.name}: Invalid file type (only PDF and images allowed)`,
          type: 'error'
        })
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
      setFileType(validFiles[0].type.split('/')[1] || validFiles[0].name.split('.').pop() || '')
    }
  }


  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (isUploading) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    const input = document.getElementById('file-upload') as HTMLInputElement
    if (input) {
      const dataTransfer = new DataTransfer()
      droppedFiles.forEach(file => dataTransfer.items.add(file))
      input.files = dataTransfer.files
      const event = new Event('change', { bubbles: true })
      input.dispatchEvent(event)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    if (newFiles.length === 0) {
      setFileType("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors = validateForm()
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
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

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return prev
          }
          return prev + 10
        })
      }, 700)

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
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
        onSuccess()
      } else {
        const error = await response.json()
        setMessage({
          text: `Upload failed: ${error.message || 'Unknown error'}`,
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
              disabled={user.role === "zonal_head"}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="file-upload" className="flex items-center gap-1.5">
            Files <span className="text-destructive">*</span>
          </Label>

          <div className="flex flex-col gap-3">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${errors.files
                ? "border-destructive bg-destructive/10"
                : "border-primary/30 hover:border-primary/50 bg-muted/50 hover:bg-muted"
                }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-medium">
                    <Button
                      variant="link"
                      className="h-auto p-0 text-base font-medium"
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById('file-upload')?.click()
                      }}
                    >
                      Click to upload
                    </Button>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG, GIF, BMP, WebP, TIFF, SVG
                  </p>
                </div>
              </div>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,image/*"
                multiple
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </div>

            {errors.files && (
              <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                {errors.files}
              </p>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Selected {files.length} file{files.length !== 1 ? 's' : ''} • {totalSize()} MB total
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-md ${file.type.includes('pdf') ? 'bg-red-50 text-red-600' :
                      file.type.includes('image') ? 'bg-blue-50 text-blue-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                      {file.type.includes('image') ? (
                        <Image className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault(), removeFile(index)
                      }}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                Uploading {files.length} file{files.length !== 1 ? 's' : ''}...
              </span>
              <span className="text-muted-foreground">
                {uploadProgress}% • {totalSize()} MB
              </span>
            </div>
            <Progress
              value={uploadProgress}
              className={`h-2 ${uploadProgress === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-primary"}`}
            />
          </div>
        )}

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertTitle className="capitalize">{message.type}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isUploading || files.length === 0}
          className="w-full gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading ({uploadProgress}%)</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>
                {files.length > 0
                  ? `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`
                  : 'Select Files to Upload'}
              </span>
            </>
          )}
        </Button>
      </form>
    </div>
  )
}