"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import Link from "next/link";
import { DateRange } from "react-day-picker";
import { subDays, format } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ApiResponse } from "./type";

export default function AccessLogsPage() {
    const [data, setData] = useState<ApiResponse>({
        logs: [],
        total: 0,
        page: 1,
        totalPages: 1,
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const fetchLogs = async (page = 1, search = searchTerm) => {
        setIsLoading(true);
        try {
            let url = `/api/admin/logs?page=${page}&limit=100`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (dateRange?.from) url += `&startDate=${dateRange.from.toISOString()}`;
            if (dateRange?.to) url += `&endDate=${dateRange.to.toISOString()}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch logs");
            const json = (await res.json()) as ApiResponse;
            setData(json);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load access logs.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, [dateRange]);

    const handleSearch = () => {
        fetchLogs(1, searchTerm);
    };

    const handleRangeSelect = (range: DateRange | undefined) => {
        setDateRange(range);
    };

    const exportLogs = async () => {
        setIsLoading(true);
        try {
            let url = `/api/admin/logs?page=1&limit=${data.total}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (dateRange?.from) url += `&startDate=${dateRange.from.toISOString()}`;
            if (dateRange?.to) url += `&endDate=${dateRange.to.toISOString()}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch logs for export");
            const { logs } = (await res.json()) as ApiResponse;

            const headers = ["Timestamp", "Email", "Action", "Filename"];
            const csv = [
                headers.join(","),
                ...logs.map((log) =>
                    [
                        `"${new Date(log.timestamp).toLocaleString()}"`,
                        `"${log.user.email}"`,
                        `"${formatAction(log.action)}"`,
                        `"${log.file?.originalFilename ?? "FileNotFound"}"`,
                    ].join(",")
                ),
            ].join("\n");

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const href = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = href;
            link.setAttribute("download", `access_logs_${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);
            toast.success("Logs exported successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to export logs.");
        } finally {
            setIsLoading(false);
        }
    };

    function formatAction(action: string) {
        switch (action.toLowerCase()) {
            case "download":
                return "Downloaded";
            case "view":
                return "Viewed";
            case "preview":
                return "Previewed";
            default:
                return action;
        }
    }

    return (
        <div className=" py-8 mx-10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Access Logs</h1>
                    <p className="text-muted-foreground">Track document access activity</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                    <Button onClick={exportLogs} disabled={isLoading} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="space-y-4 px-6 py-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto md:flex-1">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by email, action, or filename…"
                                    className="h-10 pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>
                            <Button onClick={handleSearch} className="h-10 gap-2 sm:w-auto" size="sm">
                                <Search className="h-4 w-4" />
                                <span className="sr-only sm:not-sr-only">Search</span>
                            </Button>
                        </div>

                        <div className="w-full md:w-auto">
                            <DateRangePicker
                                onUpdate={handleRangeSelect}
                                initialDateFrom={dateRange?.from}
                                initialDateTo={dateRange?.to}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                    ) : data.logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Search className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No logs found</h3>
                            <p className="text-sm text-muted-foreground">
                                {searchTerm || dateRange ? "Try different search criteria" : "No activity recorded yet"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <ScrollArea className="h-[500px] rounded-md border">
                                <div className="divide-y">
                                    {data.logs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{log.user.email}</p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {formatAction(log.action)} • {log.file?.originalFilename || "A file was deleted"}
                                                </p>
                                            </div>
                                            <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {data.logs.length} of {data.total} logs (Page {data.page} of {data.totalPages})
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={data.page <= 1 || isLoading}
                                        onClick={() => fetchLogs(data.page - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={data.page >= data.totalPages || isLoading}
                                        onClick={() => fetchLogs(data.page + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}