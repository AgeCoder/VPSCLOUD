"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import Link from "next/link"

type AccessLog = {
    id: number
    timestamp: string
    action: string
    user: {
        email: string
    }
    file: {
        originalFilename: string
    }
}

export default function AccessLogsPage() {
    const [logs, setLogs] = useState<AccessLog[]>([])
    const [filteredLogs, setFilteredLogs] = useState<AccessLog[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(1)
    const logsPerPage = 20

    useEffect(() => {
        fetchLogs()
    }, [])

    useEffect(() => {
        filterLogs()
    }, [searchTerm, logs, page])

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const response = await fetch("/api/admin/logs")
            if (response.ok) {
                const data = await response.json()
                console.log(data);

                setLogs(data)
            } else {
                throw new Error("Failed to fetch logs")
            }
        } catch (error) {
            console.error("Error fetching logs:", error)
            toast.error("Failed to load access logs")
        } finally {
            setIsLoading(false)
        }
    }

    const filterLogs = () => {
        if (!searchTerm) {
            const startIndex = (page - 1) * logsPerPage
            setFilteredLogs(logs.slice(startIndex, startIndex + logsPerPage))
            return
        }

        const lowerSearch = searchTerm.toLowerCase()
        const filtered = logs.filter(log =>
            log.user.email.toLowerCase().includes(lowerSearch) ||
            log.action.toLowerCase().includes(lowerSearch) ||
            log.file.originalFilename.toLowerCase().includes(lowerSearch)
        )
        setFilteredLogs(filtered.slice(0, logsPerPage))
        setPage(1)
    }

    const exportLogs = () => {
        try {
            const headers = ["Timestamp", "User Email", "Action", "Filename"]
            const csvContent = [
                headers.join(","),
                ...logs.map(log =>
                    [
                        `"${new Date(log.timestamp).toLocaleString()}"`,
                        `"${log.user.email}"`,
                        `"${log.action}"`,
                        `"${log?.file?.originalFilename ?? 'FileNotFound'}"`
                    ].join(",")
                )
            ].join("\n")

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `access_logs_${new Date().toISOString()}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success("Logs exported successfully")
        } catch (error) {
            console.error("Error exporting logs:", error)
            toast.error("Failed to export logs")
        }
    }

    const formatAction = (action: string) => {
        switch (action.toLowerCase()) {
            case 'download': return 'Downloaded'
            case 'view': return 'Viewed'
            case 'preview': return 'Previewed'
            default: return action
        }
    }
    console.log(filteredLogs);

    return (
        <div className="container py-8 mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Access Logs</h1>
                    <p className="text-muted-foreground">Track document access activity</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/dashboard">
                            Back to Dashboard
                        </Link>
                    </Button>
                    <Button onClick={exportLogs} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by email, action, or filename..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Search className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No logs found</h3>
                            <p className="text-sm text-muted-foreground">
                                {searchTerm ? "Try a different search term" : "No activity recorded yet"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <ScrollArea className="h-[500px] rounded-md border">
                                <div className="divide-y">
                                    {filteredLogs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{log?.user?.email || "Unknown user"}</p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {formatAction(log?.action)} • {log?.file?.originalFilename || "A file was deleted"}
                                                </p>
                                            </div>
                                            <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                                                {log?.timestamp ? new Date(log.timestamp).toLocaleString() : "Unknown time"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {filteredLogs.length} of {logs.length} logs
                                </div>
                                {!searchTerm && logs.length > logsPerPage && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page * logsPerPage >= logs.length}
                                            onClick={() => setPage(p => p + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}