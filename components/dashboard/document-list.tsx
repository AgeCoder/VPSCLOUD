"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "../ui/label"
import { SearchBar } from "./search-bar"
import { DocumentListProps } from "./types"
import { Card, CardContent } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { X } from "lucide-react"
import FilteredDocumentsComp from "./FilteredDocuments"

export function DocumentList({
  documents,
  searchQuery,
  isLoading,
  user,
  onDocumentDeleted,
  setDocuments,
  onChange,
}: DocumentListProps) {
  const [filters, setFilters] = useState({
    year: "all",
    branch: "all",
    zone: "all",
    docType: "all",
    fileType: "all"
  })
  const [isFilterApplied, setIsFilterApplied] = useState(false)

  const filterOptions = {
    years: [...new Set(documents.map((doc) => doc.year))].sort((a, b) => b.localeCompare(a)),
    branches: [...new Set(documents.map((doc) => doc.branch))].sort(),
    zones: [...new Set(documents.map((doc) => doc.zone))].sort(),
    docTypes: [...new Set(documents.map((doc) => doc.type))].sort(),
    fileTypes: [...new Set(documents.map((doc) => doc.filetype))].sort()
  }

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }))
  }

  const applyFilters = () => {
    setIsFilterApplied(true)
  }

  const resetFilters = () => {
    setFilters({
      year: "all",
      branch: "all",
      zone: "all",
      docType: "all",
      fileType: "all"
    })
    setIsFilterApplied(false)
  }

  const filteredDocuments = isFilterApplied
    ? documents.filter((doc) => {
      const matchesSearch = doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesYear = filters.year === "all" || doc.year === filters.year
      const matchesBranch = filters.branch === "all" || doc.branch === filters.branch
      const matchesZone = filters.zone === "all" || doc.zone === filters.zone
      const matchesDocType = filters.docType === "all" || doc.type === filters.docType
      const matchesFileType = filters.fileType === "all" || doc.filetype === filters.fileType

      return matchesSearch && matchesYear && matchesBranch && matchesZone && matchesDocType && matchesFileType
    })
    : []

  const hasActiveFilters = Object.values(filters).some(filter => filter !== "all") || isFilterApplied

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div>
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }


  return (
    <div className="space-y-2 min-h-screen mb-28">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 border rounded-lg">
        <FilterSelect
          label="Year"
          values={filterOptions.years}
          value={filters.year}
          onChange={(value) => handleFilterChange('year', value)}
        />
        <FilterSelect
          label="Zone"
          values={filterOptions.zones}
          value={filters.zone}
          onChange={(value) => handleFilterChange('zone', value)}
        />
        <FilterSelect
          label="Branch"
          values={filterOptions.branches}
          value={filters.branch}
          onChange={(value) => handleFilterChange('branch', value)}
        />
        <FilterSelect
          label="Document Type"
          values={filterOptions.docTypes}
          value={filters.docType}
          onChange={(value) => handleFilterChange('docType', value)}
        />
        <FilterSelect
          label="File Type"
          values={filterOptions.fileTypes}
          value={filters.fileType}
          onChange={(value) => handleFilterChange('fileType', value)}
        />
      </div>

      <div className="flex justify-end items-center gap-4">
        <Button onClick={applyFilters}>
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={resetFilters} className="p-4">
            Clear filters
            <X className="w-4 h-4 " />
          </Button>
        )}
      </div>

      <div>
        <SearchBar
          value={searchQuery}
          onChange={onChange}
        />
      </div>

      {!isFilterApplied ? (
        <div className="flex justify-center items-center h-64 opacity-60">
          <img src="/logo.png" alt="Watermark Logo" className="h-48" />
        </div>
      ) : (
        <FilteredDocumentsComp
          filteredDocuments={filteredDocuments}
          documents={documents}
          onDocumentDeleted={onDocumentDeleted}
          user={user}
          setDocuments={setDocuments}
        />
      )}
    </div>
  )
}

function FilterSelect({ label, values, value, onChange }: {
  label: string,
  values: string[],
  value: string,
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1" key={label}>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`All ${label.toLowerCase()}s`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {values.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}