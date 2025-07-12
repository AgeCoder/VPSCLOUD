'use client'

import { useEffect, useState } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    Loader2,
    HardDrive,
    File,
    Database,
    PieChart,
    BarChart,
    Calendar,
    FileText,
    FileArchive,
    FileImage,
    FileVideo,
    FileCode,
    ArrowLeft
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBytes, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface FileType {
    type: string
    count: number
    size: number
    percentage: number
}

interface SizeRange {
    min: number
    max: number
    count: number
    size: number
}

interface AnalyticsData {
    // Basic stats
    totalObjects: number
    totalSize: number
    totalSizeMB: number
    totalSizeGB: number

    // Enhanced analytics
    fileTypes: FileType[]
    sizeDistribution: {
        small: SizeRange
        medium: SizeRange
        large: SizeRange
    }
    recentActivity: {
        filesCount: number
        filesSize: number
        filesSizeMB: number
        percentage: number
    }

    // Sample files
    largestFiles: Array<{
        Key: string
        Size: number
        LastModified?: string
    }>
    recentFiles: Array<{
        Key: string
        Size: number
        LastModified?: string
    }>
    sampleFiles: Array<{
        Key: string
        Size: number
        LastModified?: string
    }>

    // Metadata
    lastUpdated: string
    analyzedCount: number
}

export default function R2AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const res = await fetch('/api/r2-analytics')
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`)
                }
                const json = await res.json()
                setData(json)
            } catch (err) {
                console.error('Error fetching analytics:', err)
                setError(err instanceof Error ? err.message : 'Unknown error occurred')
            } finally {
                setIsLoading(false)
            }
        }

        fetchAnalytics()
    }, [])

    const getFileIcon = (filename: string) => {
        const extension = filename.split('.').pop()?.toLowerCase()
        switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
                return <FileImage className="h-4 w-4 text-blue-500" />
            case 'mp4':
            case 'mov':
            case 'avi':
            case 'mkv':
                return <FileVideo className="h-4 w-4 text-purple-500" />
            case 'zip':
            case 'rar':
            case '7z':
            case 'tar':
            case 'gz':
                return <FileArchive className="h-4 w-4 text-yellow-500" />
            case 'js':
            case 'ts':
            case 'jsx':
            case 'tsx':
            case 'json':
            case 'html':
            case 'css':
                return <FileCode className="h-4 w-4 text-green-500" />
            case 'pdf':
            case 'doc':
            case 'docx':
            case 'txt':
                return <FileText className="h-4 w-4 text-red-500" />
            default:
                return <File className="h-4 w-4 text-gray-500" />
        }
    }
    function cleanFileName(key: string) {
        const [folder, fullName] = key.split('/')

        // Remove UUID pattern: 8-4-4-4-12 characters followed by a dash
        const cleanName = fullName.replace(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/,
            ''
        )

        return `${folder} ${cleanName}`
    }


    if (isLoading) {
        return <LoadingSkeleton />
    }

    if (error || !data) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center h-[60vh]">
                    <Database className="h-12 w-12 text-red-500" />
                    <h2 className="text-2xl font-bold text-red-500">Failed to load analytics</h2>
                    <p className="text-muted-foreground">
                        {error || "Unknown error occurred"}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        R2 Bucket Analytics
                    </h1>
                    <p className="text-muted-foreground">
                        Last updated: {formatDate(data.lastUpdated)}
                    </p>
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

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                {/* Storage Overview Card */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Storage Overview
                        </CardTitle>
                        <CardDescription>
                            {data.analyzedCount} objects analyzed
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Storage Used
                                </span>
                                <span className="text-sm font-semibold">
                                    {data.totalSizeGB.toFixed(2)} GB
                                </span>
                            </div>
                            <Progress
                                value={(data.totalSizeGB / 100) * 100} // Assuming 100GB free tier
                                className="h-2"
                            />
                            <div className="mt-1 text-xs text-muted-foreground text-right">
                                {((data.totalSizeGB / 100) * 100).toFixed(1)}% of free tier
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total Files</span>
                                    <Badge variant="outline" className="text-sm">
                                        {data.totalObjects}
                                    </Badge>
                                </div>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Recent Files (30d)</span>
                                    <Badge variant="outline" className="text-sm">
                                        {data.recentActivity.filesCount}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* File Types Card */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart className="h-5 w-5" />
                            File Types
                        </CardTitle>
                        <CardDescription>
                            Distribution by file type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.fileTypes.slice(0, 5).map((fileType) => (
                                <div key={fileType.type} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {getFileIcon(`file.${fileType.type}`)}
                                            <span className="text-sm font-medium capitalize">
                                                {fileType.type || 'unknown'}
                                            </span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {fileType.count} files
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Progress
                                            value={fileType.percentage}
                                            className="h-2 flex-1"
                                        />
                                        <span className="text-xs text-muted-foreground w-12 text-right">
                                            {fileType.percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Size Distribution Card */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart className="h-5 w-5" />
                            Size Distribution
                        </CardTitle>
                        <CardDescription>
                            How your files are distributed by size
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(data.sizeDistribution).map(([range, data]) => (
                                <div key={range} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium capitalize">
                                            {range} files
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {data.count} files ({formatBytes(data.size)})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Progress
                                            value={(data.count / data.totalObjects) * 100}
                                            className="h-2 flex-1"
                                        />
                                        <span className="text-xs text-muted-foreground w-12 text-right">
                                            {((data.count / data.totalObjects) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {/* Largest Files Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <File className="h-5 w-5" />
                            Largest Files
                        </CardTitle>
                        <CardDescription>
                            Top 5 largest files in your bucket
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Filename</TableHead>
                                    <TableHead className="text-right">Size</TableHead>
                                    <TableHead className="text-right">Modified</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.largestFiles.map((file, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium truncate max-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                {getFileIcon(file.Key)}
                                                {cleanFileName(file.Key)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatBytes(file.Size)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            {file.LastModified ? formatDate(file.LastModified) : 'Unknown'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Recently Modified Files Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Recently Modified
                        </CardTitle>
                        <CardDescription>
                            Files modified in the last 30 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Filename</TableHead>
                                    <TableHead className="text-right">Size</TableHead>
                                    <TableHead className="text-right">Modified</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.recentFiles.map((file, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium truncate max-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                {getFileIcon(file.Key)}
                                                {cleanFileName(file.Key)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatBytes(file.Size)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            {file.LastModified ? formatDate(file.LastModified) : 'Unknown'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="p-8 flex flex-col gap-8 max-w-7xl mx-auto">
            <div className="space-y-2">
                <Skeleton className="h-8 w-[300px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-[150px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[...Array(5)].map((_, j) => (
                                <div key={j} className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-2 w-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-[150px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[...Array(5)].map((_, j) => (
                                    <div key={j} className="flex justify-between">
                                        <Skeleton className="h-4 w-[120px]" />
                                        <Skeleton className="h-4 w-[60px]" />
                                        <Skeleton className="h-4 w-[80px]" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}