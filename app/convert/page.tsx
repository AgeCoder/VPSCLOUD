'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, FileImage, FileText, Download, ArrowLeft, Trash, Merge, FileInput } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import jsPDF from 'jspdf'

type ConversionMode = 'separate' | 'merged'
type FileWithPreview = File & { preview?: string; customName?: string }

export default function ImageToPDFConverter() {
    const [files, setFiles] = useState<FileWithPreview[]>([])
    const [isConverting, setIsConverting] = useState(false)
    const [conversionMode, setConversionMode] = useState<ConversionMode>('separate')
    const [baseFilename, setBaseFilename] = useState('document')
    const [mergedFilename, setMergedFilename] = useState('merged')
    const [compressPDF, setCompressPDF] = useState(true)
    const [renameDialogOpen, setRenameDialogOpen] = useState(false)
    const [currentRenameIndex, setCurrentRenameIndex] = useState(0)
    const [renameValue, setRenameValue] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).filter(file =>
                file.type.startsWith('image/')
            )

            const filesWithPreview = newFiles.map(file => {
                const fileWithPreview: FileWithPreview = file
                fileWithPreview.preview = URL.createObjectURL(file)
                fileWithPreview.customName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
                return fileWithPreview
            })

            setFiles(prev => [...prev, ...filesWithPreview])
        }
    }

    const removeFile = (index: number) => {
        if (files[index].preview) {
            URL.revokeObjectURL(files[index].preview!)
        }
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const openRenameDialog = (index: number) => {
        setCurrentRenameIndex(index)
        setRenameValue(files[index].customName || files[index].name.replace(/\.[^/.]+$/, ''))
        setRenameDialogOpen(true)
    }

    const handleRename = () => {
        setFiles(prev => {
            const newFiles = [...prev]
            newFiles[currentRenameIndex] = {
                ...newFiles[currentRenameIndex],
                customName: renameValue
            }
            return newFiles
        })
        setRenameDialogOpen(false)
    }

    const convertToPDF = async () => {
        if (files.length === 0) {
            toast.warning('Please select at least one image')
            return
        }

        setIsConverting(true)
        toast.info(`Converting images to ${conversionMode === 'separate' ? 'separate PDFs' : 'a single PDF'}...`)

        try {
            const { jsPDF } = await import('jspdf')

            if (conversionMode === 'separate') {
                const zip = new JSZip()

                for (let i = 0; i < files.length; i++) {
                    const file = files[i]
                    const pdf = await createPDFFromImage(file, compressPDF)

                    const filename = file.customName || baseFilename
                    const numberedFilename = files.length > 1 ?
                        `${filename}-${i + 1}.pdf` :
                        `${filename}.pdf`

                    zip.file(numberedFilename, pdf.output('blob'))
                }

                const content = await zip.generateAsync({ type: 'blob' })
                saveAs(content, `${baseFilename}-converted.zip`)
            } else {
                // Merged PDF
                const pdf = new jsPDF()
                let firstImage = true

                for (const file of files) {
                    if (!firstImage) {
                        pdf.addPage()
                    }

                    const img = await createImageBitmap(file)
                    const dimensions = calculateImageDimensions(img, pdf)

                    const canvas = document.createElement('canvas')
                    canvas.width = img.width
                    canvas.height = img.height
                    const ctx = canvas.getContext('2d')

                    if (ctx) {
                        ctx.drawImage(img, 0, 0)
                        const imageData = canvas.toDataURL('image/jpeg', compressPDF ? 0.7 : 0.95)
                        pdf.addImage(imageData, 'JPEG', dimensions.x, dimensions.y, dimensions.width, dimensions.height)
                    }

                    firstImage = false
                    img.close()
                }

                saveAs(pdf.output('blob'), `${mergedFilename}.pdf`)
            }

            toast.success('Conversion completed successfully!')
        } catch (error) {
            console.error('Conversion error:', error)
            toast.error('Failed to convert images to PDF')
        } finally {
            setIsConverting(false)
        }
    }

    const createPDFFromImage = async (file: File, compress: boolean): Promise<jsPDF> => {
        const pdf = new jsPDF()
        const img = await createImageBitmap(file)
        const dimensions = calculateImageDimensions(img, pdf)

        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')

        if (ctx) {
            ctx.drawImage(img, 0, 0)
            const imageData = canvas.toDataURL('image/jpeg', compress ? 0.7 : 0.95)
            pdf.addImage(imageData, 'JPEG', dimensions.x, dimensions.y, dimensions.width, dimensions.height)
        }

        img.close()
        return pdf
    }

    const calculateImageDimensions = (img: ImageBitmap, pdf: jsPDF) => {
        const widthRatio = pdf.internal.pageSize.getWidth() / img.width
        const heightRatio = pdf.internal.pageSize.getHeight() / img.height
        const ratio = Math.min(widthRatio, heightRatio, 1) // Don't scale up

        const width = img.width * ratio
        const height = img.height * ratio

        // Center the image on the page
        const x = (pdf.internal.pageSize.getWidth() - width) / 2
        const y = (pdf.internal.pageSize.getHeight() - height) / 2

        return { x, y, width, height }
    }

    return (
        <div className="container mx-auto mt-2 px-4 max-w-7xl min-h-screen ">
            <Card className=''>
                <CardHeader>
                    <div className='w-full justify-between flex'>
                        <div>
                            <CardTitle className="text-xl font-bold">Image to PDF Converter</CardTitle>
                            <CardDescription>
                                Convert images to PDF files with flexible naming and merging options
                            </CardDescription>
                        </div>
                        <Link href='/dashboard'>
                            <Button>
                                <ArrowLeft />
                                Dashboard
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center mb-8">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            multiple
                            className="hidden"
                        />
                        <div className="flex flex-col items-center justify-center gap-4">
                            <Upload className="w-12 h-12 text-muted-foreground" />
                            <div>
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Select Images
                                </Button>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Supports JPG, PNG, WEBP, etc.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <RadioGroup
                            value={conversionMode}
                            onValueChange={(value) => setConversionMode(value as ConversionMode)}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="separate" id="separate" />
                                <Label htmlFor="separate">Separate PDFs</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="merged" id="merged" />
                                <Label htmlFor="merged">Merged PDF</Label>
                            </div>
                        </RadioGroup>

                        {conversionMode === 'separate' && (
                            <div className="space-y-2">
                                <Label>Base Filename</Label>
                                <Input
                                    value={baseFilename}
                                    onChange={(e) => setBaseFilename(e.target.value)}
                                    placeholder="Enter base filename"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Files will be named as: {baseFilename}-1.pdf, {baseFilename}-2.pdf, etc.
                                </p>
                            </div>
                        )}

                        {conversionMode === 'merged' && (
                            <div className="space-y-2">
                                <Label>Merged PDF Filename</Label>
                                <Input
                                    value={mergedFilename}
                                    onChange={(e) => setMergedFilename(e.target.value)}
                                    placeholder="Enter merged filename"
                                />
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="compress"
                                checked={compressPDF}
                                onCheckedChange={setCompressPDF}
                            />
                            <Label htmlFor="compress">Compress PDF (smaller file size)</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {files.length > 0 && (
                <div className="mb-8 mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                            Selected Files
                            <span className='text-green-600'> ({files.length})</span>
                        </h2>
                        <div className='flex gap-4'>
                            <Button onClick={() => setFiles([])} disabled={isConverting}>
                                Clear All
                            </Button>
                            <Button
                                onClick={convertToPDF}
                                disabled={files.length === 0 || isConverting}
                                className="gap-2"
                            >
                                {isConverting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Converting...
                                    </>
                                ) : (
                                    <>
                                        {conversionMode === 'separate' ? (
                                            <FileText className="w-4 h-4" />
                                        ) : (
                                            <Merge className="w-4 h-4" />
                                        )}
                                        {conversionMode === 'separate' ? 'Convert to PDFs' : 'Merge to Single PDF'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="h-96 border p-5 rounded-2xl">
                        {files.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between p-3 border rounded-lg mt-2"
                            >
                                <div className="flex items-center gap-3">
                                    {file.preview ? (
                                        <img
                                            src={file.preview}
                                            alt="Preview"
                                            className="w-10 h-10 object-cover rounded"
                                        />
                                    ) : (
                                        <FileImage className="w-5 h-5 text-blue-500" />
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-medium">{file.customName || file.name.replace(/\.[^/.]+$/, '')}</span>
                                        <span className="text-xs text-muted-foreground">{file.name}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openRenameDialog(index)}
                                        disabled={isConverting}
                                    >
                                        <FileInput className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFile(index)}
                                        disabled={isConverting}
                                    >
                                        <Trash className="w-4 h-4 text-red-700" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
            )}

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename File</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="Enter new name (without extension)"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleRename}>
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}