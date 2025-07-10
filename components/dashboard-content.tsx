"use client"

import { useState, useEffect } from "react"
import { DocumentList } from "@/components/document-list"
import { UploadForm } from "@/components/upload-form"
import { SearchBar } from "@/components/search-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Settings, UploadCloud, FileSearch } from "lucide-react"
import Navbar from "./layout/Navbar"
import { AdminDashboard } from "./admin-dashboard"

interface User {
  id: string
  email: string
  role: string
  zone?: string
  branch?: string
}

interface DashboardContentProps {
  user: User
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("documents")

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/documents")
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadSuccess = () => {
    fetchDocuments()
    setActiveTab("documents")
  }

  return (
    <div className="min-h-screen ">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col ">
          {/* Header with welcome message */}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className=""
          >
            <TabsList className="w-full ">
              <TabsTrigger value="documents" className="gap-2 w-full">
                <FileSearch className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2 w-full">
                <UploadCloud className="h-4 w-4" />
                Upload
              </TabsTrigger>
              {user.role === "admin" && (
                <TabsTrigger value="admin" className="gap-2 w-full">
                  <Settings className="h-4 w-4" />
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="documents" className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Document Library</CardTitle>
                  <CardDescription>
                    {documents.length} documents available in {user.branch || user.zone}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                  />
                  <DocumentList
                    documents={documents}
                    searchQuery={searchQuery}
                    isLoading={isLoading}
                    user={user}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Upload New Document</CardTitle>
                </CardHeader>
                <CardContent>
                  <UploadForm
                    user={user}
                    onSuccess={handleUploadSuccess}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {user.role === "admin" && (
              <TabsContent value="admin">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Administration</CardTitle>
                    <CardDescription>
                      Manage users, permissions, and system settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AdminDashboard />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  )
}