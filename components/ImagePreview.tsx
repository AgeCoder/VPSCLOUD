'use client'

import { useState, useRef, useEffect } from 'react'
import {
    ZoomIn,
    ZoomOut,
    Printer,
    RotateCw,
    RotateCcw,
    Maximize,
    Minimize,
    X
} from 'lucide-react'

export default function ImagePreview({
    previewUrl,
    onClose
}: {
    previewUrl: string
    onClose?: () => void
}) {
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const imageRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })

    // Reset position and zoom when image changes
    useEffect(() => {
        setZoom(1)
        setRotation(0)
        setPosition({ x: 0, y: 0 })
    }, [previewUrl])

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return
        printWindow.document.write(`
      <html>
        <head><title>Print Image</title></head>
        <body style="margin:0;display:flex;justify-content:center;align-items:center;">
          <img src="${previewUrl}" style="max-width:100%;max-height:100%;" />
        </body>
      </html>
    `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
    }



    const resetImage = () => {
        setZoom(1)
        setRotation(0)
        setPosition({ x: 0, y: 0 })
    }

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            imageRef.current?.requestFullscreen?.()
        } else {
            document.exitFullscreen?.()
        }
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        setPosition({
            x: e.clientX - startPos.x,
            y: e.clientY - startPos.y
        })
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
        }
    }, [])

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 z-99 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            )}

            <div className="flex gap-2 mb-4 flex-wrap justify-center">
                <button
                    onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setZoom((z) => Math.min(5, z + 0.1))}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    title="Rotate Clockwise"
                >
                    <RotateCw className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setRotation((r) => (r - 90) % 360)}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    title="Rotate Counter-Clockwise"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                <button
                    onClick={resetImage}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    title="Reset"
                >
                    <span className="text-sm font-medium">Reset</span>
                </button>
                <button
                    onClick={handlePrint}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    title="Print"
                >
                    <Printer className="w-5 h-5" />
                </button>

                <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
            </div>

            <div
                ref={imageRef}
                className="relative overflow-hidden w-full h-full flex items-center justify-center"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <img
                    src={previewUrl}
                    alt="Preview"
                    style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: 'center',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        position: 'relative',
                        left: position.x,
                        top: position.y,
                        transition: isDragging ? 'none' : 'transform 0.3s ease'
                    }}
                    className="object-contain max-w-full max-h-full select-none"
                    draggable="false"
                />
            </div>

            <div className="mt-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                Zoom: {Math.round(zoom * 100)}% | Rotation: {rotation}°
            </div>
        </div>
    )
}