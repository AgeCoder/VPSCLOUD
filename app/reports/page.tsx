'use client'

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    Table, TableHead, TableRow, TableCell, TableBody, TableHeader
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, FilterX, ChevronDown, ChevronUp, Search, ChevronLeft } from "lucide-react"
import * as XLSX from 'xlsx'
import Image from "next/image"
import Link from "next/link"

interface ReportRow {
    zone: string
    branch: string
    year: string
    type: string
    count: number
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportRow[]>([])
    const [search, setSearch] = useState("")
    const [filterYear, setFilterYear] = useState("all")
    const [filterType, setFilterType] = useState("all")
    const [filterZone, setFilterZone] = useState("all")
    const [filterBranch, setFilterBranch] = useState("all")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [zoneBranchMap, setZoneBranchMap] = useState<Record<string, string[]>>({})
    const [sortConfig, setSortConfig] = useState<{
        key: keyof ReportRow; direction: 'ascending' | 'descending'
    } | null>(null)
    const [showResults, setShowResults] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const res = await fetch("/api/admin/reports/documents")
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`)
                }
                const text = await res.text()
                const json = text ? JSON.parse(text) : []
                setData(json)
                const zoneMap: Record<string, string[]> = {}
                json.forEach((row: ReportRow) => {
                    if (!zoneMap[row.zone]) {
                        zoneMap[row.zone] = []
                    }
                    if (!zoneMap[row.zone].includes(row.branch)) {
                        zoneMap[row.zone].push(row.branch)
                    }
                })
                setZoneBranchMap(zoneMap)
            } catch (e) {
                console.error("Failed to fetch data:", e)
                setError("Failed to load data. Please try again later.")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleSort = (key: keyof ReportRow) => {
        const direction = sortConfig?.key === key && sortConfig.direction === 'ascending'
            ? 'descending' : 'ascending'
        setSortConfig({ key, direction })
    }

    const sorted = sortConfig
        ? [...data].sort((a, b) => {
            const aVal = a[sortConfig.key]
            const bVal = b[sortConfig.key]
            if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1
            if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1
            return 0
        })
        : data

    const filtered = sorted.filter(r =>
        r.branch.toLowerCase().includes(search.toLowerCase()) &&
        (filterYear === "all" || r.year === filterYear) &&
        (filterType === "all" || r.type === filterType) &&
        (filterZone === "all" || r.zone === filterZone) &&
        (filterBranch === "all" || r.branch === filterBranch)
    )

    const clearFilters = () => {
        setSearch("")
        setFilterYear("all")
        setFilterType("all")
        setFilterZone("all")
        setFilterBranch("all")
        setSortConfig(null)
        setShowResults(false)
    }

    const applyFilters = () => {
        setShowResults(true)
    }

    const exportToExcel = () => {
        if (filtered.length === 0) return

        const ws = XLSX.utils.json_to_sheet(filtered)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Document Report")
        XLSX.writeFile(wb, "document_report.xlsx")
    }

    const exportToCSV = () => {
        if (filtered.length === 0) return

        const header = Object.keys(filtered[0]).join(",")
        const rows = filtered.map(r => Object.values(r).join(",")).join("\n")
        const blob = new Blob([header + "\n" + rows], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "document_report.csv"
        link.click()
        URL.revokeObjectURL(url)
    }

    const getSortIcon = (k: keyof ReportRow) =>
        sortConfig?.key === k
            ? (sortConfig.direction === 'ascending'
                ? <ChevronUp className="inline ml-1 h-4 w-4" />
                : <ChevronDown className="inline ml-1 h-4 w-4" />)
            : null

    const filterOptions = (key: keyof ReportRow) => {
        const options = Array.from(new Set(data.map(d => d[key])))
        return ["all", ...options]
    }
    useEffect(() => {
        setFilterBranch("all")
    }, [filterZone])
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Image
                    src="logo.png"
                    alt="Loading"
                    width={200}
                    height={200}
                    className="animate-pulse"
                />
                <p className="text-lg">Loading report data...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Image
                    src="logo.png"
                    alt="Error"
                    width={200}
                    height={200}
                />
                <div className="text-red-500 text-lg">{error}</div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Document Report</h2>
                <div className="flex gap-2">

                    <Button
                        variant="outline"
                        onClick={exportToExcel}
                        disabled={!showResults || filtered.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" /> Excel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={exportToCSV}
                        disabled={!showResults || filtered.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" /> CSV
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard">
                            <ChevronLeft className="h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">

                <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {filterOptions("year").map(year => (
                            <SelectItem key={year} value={String(year)}>
                                {year === "all" ? "All Years" : year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                        {filterOptions("type").map(type => (
                            <SelectItem key={type} value={String(type)}>
                                {type === "all" ? "All Types" : type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterZone} onValueChange={setFilterZone}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Zone" />
                    </SelectTrigger>
                    <SelectContent>
                        {filterOptions("zone").map(zone => (
                            <SelectItem key={zone} value={String(zone)}>
                                {zone === "all" ? "All Zones" : zone}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={filterBranch}
                    onValueChange={setFilterBranch}
                    disabled={filterZone === "all"}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Branch" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {filterZone !== "all" &&
                            zoneBranchMap[filterZone]?.map(branch => (
                                <SelectItem key={branch} value={branch}>
                                    {branch}
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
                <div className="flex justify-between items-center gap-2">
                    <Button onClick={applyFilters}>
                        Apply Filters
                    </Button>
                    <Button variant="ghost" onClick={clearFilters}>
                        <FilterX className="mr-2 h-4 w-4" /> Clear Filters
                    </Button>
                </div>
            </div>

            <div className="relative md:col-span-5 mb-3">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                    placeholder="Search branch..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {showResults ? (
                <>
                    <div className="text-sm text-gray-500 mb-4">
                        Showing {filtered.length} of {data.length} records
                    </div>
                    <div className="border rounded-lg overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {["zone", "branch", "year", "type", "count"].map(key => (
                                        <TableHead
                                            key={key}
                                            className="cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort(key as keyof ReportRow)}
                                        >
                                            <div className="flex items-center">
                                                {key.charAt(0).toUpperCase() + key.slice(1)}
                                                {getSortIcon(key as keyof ReportRow)}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? filtered.map((r, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{r.zone}</TableCell>
                                        <TableCell>{r.branch}</TableCell>
                                        <TableCell>{r.year}</TableCell>
                                        <TableCell>{r.type}</TableCell>
                                        <TableCell>{r.count}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            No records found matching your filters
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={200}
                        height={200}
                        className="opacity-80"
                    />
                    <p className="text-gray-500">Apply filters to view report data</p>
                </div>
            )}
        </div>
    )
}