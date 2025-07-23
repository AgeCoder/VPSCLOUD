"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/datepicker";

const PAGE_SIZE = 10;

type LoginSession = {
    id: string;
    userId: string;
    email: string;
    loginAt: string;
};

export default function LoginSessionsClient() {
    const [allSessions, setAllSessions] = useState<LoginSession[]>([]);
    const [sessions, setSessions] = useState<LoginSession[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchEmail, setSearchEmail] = useState("");
    const [dateFrom, setDateFrom] = useState<Date | null>(null);
    const [dateTo, setDateTo] = useState<Date | null>(null);

    // 1. Fetch all sessions once on mount
    useEffect(() => {
        const fetchAllSessions = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/admin/login-sessions?page=1`);
                const data = await response.json();

                if (data.success) {
                    setAllSessions(data.data.sessions);
                    setCurrentPage(1);
                    updateFilteredSessions(data.data.sessions, 1);
                }
            } catch (error) {
                console.error("Failed to fetch sessions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllSessions();
    }, []);

    // 2. Filter sessions client-side
    const updateFilteredSessions = (baseSessions: LoginSession[], page: number) => {
        let filtered = baseSessions;

        if (searchEmail) {
            filtered = filtered.filter((s) =>
                s.email.toLowerCase().includes(searchEmail.toLowerCase())
            );
        }

        if (dateFrom) {
            filtered = filtered.filter((s) => new Date(s.loginAt) >= dateFrom);
        }

        if (dateTo) {
            filtered = filtered.filter((s) => new Date(s.loginAt) <= dateTo);
        }

        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;

        setSessions(filtered.slice(start, end));
        setTotalPages(Math.ceil(filtered.length / PAGE_SIZE));
        setCurrentPage(page);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilteredSessions(allSessions, 1);
    };

    const handlePageChange = (newPage: number) => {
        updateFilteredSessions(allSessions, newPage);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold tracking-tight">Login Activity</h1>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard">
                            <ChevronLeft className="h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Showing login sessions from the last 10 days
                </p>
            </div>

            {/* Search Section */}
            <div className="bg-muted/50 p-4 rounded-lg">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Search by email"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <DatePicker
                            selected={dateFrom}
                            onChange={setDateFrom}
                            placeholderText="From date"
                            className="w-full"
                        />
                        <DatePicker
                            selected={dateTo}
                            onChange={setDateTo}
                            placeholderText="To date"
                            className="w-full"
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                    </Button>
                </form>
            </div>

            {/* Content Section */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <p className="text-muted-foreground">Loading sessions...</p>
                </div>
            ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <p className="text-muted-foreground">No login sessions found</p>
                    <Button variant="outline" onClick={() => updateFilteredSessions(allSessions, 1)}>
                        Try Again
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-lg border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="p-4 text-left font-medium">#</th>
                                    <th className="p-4 text-left font-medium">User ID</th>
                                    <th className="p-4 text-left font-medium">Email</th>
                                    <th className="p-4 text-left font-medium">Login Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {sessions.map((session, index) => (
                                    <tr key={session.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="p-4">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                                        <td className="p-4 font-medium">{session.userId}</td>
                                        <td className="p-4">{session.email}</td>
                                        <td className="p-4 text-muted-foreground">
                                            {format(new Date(session.loginAt), "PPpp")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-2">
                            <div className="text-sm text-muted-foreground">
                                Showing page {currentPage} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1 || loading}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage >= totalPages || loading}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
