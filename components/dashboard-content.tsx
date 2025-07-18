"use client"

import { useState, useEffect } from "react"
import { DocumentList } from "@/components/document-list"
import { UploadForm } from "@/components/upload-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UploadCloud, FileSearch } from "lucide-react"

interface User {
  id: string
  email: string
  role: string
  zone?: string
  branch?: string
}

interface DashboardContentProps {
  user: User
  zoneMapping: Record<string, string[]>
  canUpload: Boolean | null
  docType: string[] | null
}

export function DashboardContent({ user, zoneMapping, canUpload, docType }: DashboardContentProps) {
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

      <Card
        className="m-2 p-5 rounded-b-2xl"
      >
        <CardContent>
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
              {
                canUpload && (
                  <TabsTrigger value="upload" className="gap-2 w-full">
                    <UploadCloud className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                )
              }
            </TabsList>

            <TabsContent value="documents">
              <DocumentList
                documents={documents}
                searchQuery={searchQuery}
                isLoading={isLoading}
                user={user}
                setDocuments={setDocuments}
                onChange={setSearchQuery}
              />

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
                    zoneMapping={zoneMapping}
                    docType={docType}
                  />
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}