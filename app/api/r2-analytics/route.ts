// app/api/r2-analytics/route.ts
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { NextResponse } from "next/server"

export async function GET() {
    const client = new S3Client({
        region: "auto",
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
        },
    })

    try {
        const result = await client.send(
            new ListObjectsV2Command({
                Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            })
        )

        const files = result.Contents || []
        const totalSize = files.reduce((acc, obj) => acc + (obj.Size || 0), 0)

        // Enhanced analytics
        const now = new Date()
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))

        // File type analysis
        const fileTypes: Record<string, { count: number, size: number }> = {}

        // Size distribution
        const sizeRanges = {
            small: { min: 0, max: 1024 * 1024, count: 0, size: 0 }, // <1MB
            medium: { min: 1024 * 1024, max: 10 * 1024 * 1024, count: 0, size: 0 }, // 1-10MB
            large: { min: 10 * 1024 * 1024, max: Infinity, count: 0, size: 0 } // >10MB
        }

        // Recent activity
        let recentFilesCount = 0
        let recentFilesSize = 0

        files.forEach(file => {
            // File type analysis
            const extension = file.Key?.split('.').pop()?.toLowerCase() || 'unknown'
            if (!fileTypes[extension]) {
                fileTypes[extension] = { count: 0, size: 0 }
            }
            fileTypes[extension].count++
            fileTypes[extension].size += file.Size || 0

            // Size distribution
            const fileSize = file.Size || 0
            for (const [range, values] of Object.entries(sizeRanges)) {
                if (fileSize >= values.min && fileSize < values.max) {
                    sizeRanges[range as keyof typeof sizeRanges].count++
                    sizeRanges[range as keyof typeof sizeRanges].size += fileSize
                    break
                }
            }

            // Recent activity (last 30 days)
            if (file.LastModified && new Date(file.LastModified) > thirtyDaysAgo) {
                recentFilesCount++
                recentFilesSize += file.Size || 0
            }
        })

        // Convert file types to array sorted by size
        const fileTypesArray = Object.entries(fileTypes)
            .map(([type, data]) => ({
                type,
                count: data.count,
                size: data.size,
                percentage: (data.size / totalSize) * 100
            }))
            .sort((a, b) => b.size - a.size)

        // Get top 5 largest files
        const largestFiles = [...files]
            .sort((a, b) => (b.Size || 0) - (a.Size || 0))
            .slice(0, 5)
            .map(file => ({
                Key: file.Key,
                Size: file.Size || 0,
                LastModified: file.LastModified?.toISOString()
            }))

        // Get most recently modified files
        const recentFiles = [...files]
            .filter(file => file.LastModified)
            .sort((a, b) => (new Date(b.LastModified!).getTime() - new Date(a.LastModified!).getTime()))
            .slice(0, 5)
            .map(file => ({
                Key: file.Key,
                Size: file.Size || 0,
                LastModified: file.LastModified?.toISOString()
            }))

        return NextResponse.json({
            // Basic stats
            totalObjects: files.length,
            totalSize: totalSize,
            totalSizeMB: totalSize / (1024 * 1024),
            totalSizeGB: totalSize / (1024 * 1024 * 1024),

            // Enhanced analytics
            fileTypes: fileTypesArray,
            sizeDistribution: sizeRanges,
            recentActivity: {
                filesCount: recentFilesCount,
                filesSize: recentFilesSize,
                filesSizeMB: recentFilesSize / (1024 * 1024),
                percentage: (recentFilesCount / files.length) * 100
            },

            // Sample files
            largestFiles,
            recentFiles,
            sampleFiles: files.slice(0, 10).map(file => ({
                Key: file.Key,
                Size: file.Size || 0,
                LastModified: file.LastModified?.toISOString()
            })),

            // Timestamp
            lastUpdated: new Date().toISOString(),
            analyzedCount: files.length
        })

    } catch (error) {
        console.error("R2 Analytics Error:", error)
        return NextResponse.json(
            {
                error: "Failed to fetch R2 data",
                detail: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}