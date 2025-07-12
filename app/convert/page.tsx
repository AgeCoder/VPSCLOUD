'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, FileImage, FileText, Download, ArrowLeft, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

import { ScrollArea } from "@/components/ui/scroll-area"

export default function ImageToPDFConverter() {
    const [files, setFiles] = useState<File[]>([])
    const [isConverting, setIsConverting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).filter(file =>
                file.type.startsWith('image/')
            )
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const convertToPDF = async () => {
        if (files.length === 0) {
            toast.warning('Please select at least one image')
            return
        }

        setIsConverting(true)
        toast.info('Converting images to PDFs...')

        try {
            const { jsPDF } = await import('jspdf')
            const zip = new JSZip()

            for (const file of files) {
                const pdf = new jsPDF()
                const img = await createImageBitmap(file)

                // Calculate dimensions to fit the page
                const widthRatio = pdf.internal.pageSize.getWidth() / img.width
                const heightRatio = pdf.internal.pageSize.getHeight() / img.height
                const ratio = Math.min(widthRatio, heightRatio, 1) // Don't scale up

                const width = img.width * ratio
                const height = img.height * ratio

                // Center the image on the page
                const x = (pdf.internal.pageSize.getWidth() - width) / 2
                const y = (pdf.internal.pageSize.getHeight() - height) / 2

                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.drawImage(img, 0, 0)
                    const imageData = canvas.toDataURL('image/jpeg', 0.95)
                    pdf.addImage(imageData, 'JPEG', x, y, width, height)
                }

                // Get filename without extension
                const filename = file.name.replace(/\.[^/.]+$/, '')
                zip.file(`${filename}.pdf`, pdf.output('blob'))
            }

            // Create zip file with all PDFs
            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, 'converted_images.zip')

            toast.success('Conversion completed successfully!')
        } catch (error) {
            console.error('Conversion error:', error)
            toast.error('Failed to convert images to PDF')
        } finally {
            setIsConverting(false)
        }
    }

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <Card>
                <CardHeader>
                    <div className='w-full justify-between flex'>
                        <div>
                            <CardTitle className="text-xl font-bold">Image to PDF Converter
                                <br />
                            </CardTitle>
                            <CardDescription>
                                Convert multiple images to PDF files while keeping their original names
                            </CardDescription>
                        </div>
                        <Link
                            href='/dashboard'
                        >
                            <Button
                            >
                                <ArrowLeft />
                                Dashboard
                            </Button></Link>
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
                </CardContent>
            </Card>




            {files.length > 0 && (
                <div className="mb-8 mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold ">Selected Files
                            <span
                                className='text-green-600'
                            >
                                {' '}
                                ({files.length})
                            </span>
                        </h2>
                        <div className='flex gap-5'>
                            <Button

                                onClick={() => setFiles([])}
                                disabled={isConverting}
                            >
                                Clear All
                            </Button>
                            <div className="flex justify-center">
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
                                            <FileText className="w-4 h-4" />
                                            Convert to PDF
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <ScrollArea className="h-96 border p-5 rounded-2xl ">
                        {files.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between p-3 border rounded-lg mt-2"
                            >
                                <div className="flex items-center gap-3">
                                    <FileImage className="w-5 h-5 text-blue-500" />
                                    <span className="truncate max-w-xs">{file.name}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFile(index)}
                                    disabled={isConverting}
                                >
                                    <Trash className='text-red-700' />
                                </Button>

                            </div>
                        ))}
                    </ScrollArea>
                </div>
            )}


        </div>
    )
}