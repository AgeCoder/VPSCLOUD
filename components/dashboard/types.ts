export interface Document {
    id: string
    filename: string
    originalFilename: string
    branch: string
    zone: string
    year: string
    type: string
    filetype: string
    uploadedAt: string
    uploadedBy: {
        email: string
    }
}

export interface DocumentListProps {
    documents: Document[]
    searchQuery: string
    isLoading: boolean
    user: any
    onDocumentDeleted?: (documentId: string) => void
    setDocuments: (docs: Document[]) => void
    onChange: (value: string) => void
}

export interface User {
    id: string
    email: string
    role: string
    zone?: string
    branch?: string
}

export interface DashboardContentProps {
    user: User
    zoneMapping: Record<string, string[]>
    canUpload: Boolean | null
    docType: string[] | null
}

export interface FilteredDocumentsProps {
    filteredDocuments: Document[]
    documents: Document[]
    user: User
    onDocumentDeleted?: (documentId: string) => void
    setDocuments: (docs: Document[]) => void
}




export interface UploadFormProps {
    user: User
    onSuccess: () => void
    zoneMapping: Record<string, string[]>
    docType: string[] | null
}

export type FormErrors = {
    zone?: string
    branch?: string
    year?: string
    docType?: string
    files?: string
}