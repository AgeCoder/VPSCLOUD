'use client'
import { startTransition } from 'react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SubmitButton } from './SubmitButton'
import { Card } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { addDocType, deleteDocType } from '@/app/setting/action'
import { useActionState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog'

interface DocType {
    id: number
    type: string
    createdAt: string
    updatedAt: string
    count?: number
}

export function DocTypeTab({ initialTypes }: { initialTypes: DocType[] }) {
    const [types, setTypes] = useState(initialTypes)
    const [newType, setNewType] = useState('')
    const [loadingId, setLoadingId] = useState<number | null>(null)

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)

    const addDocTypeWithState = async (_prevState: any, formData: FormData) => await addDocType(formData)
    const deleteDocTypeWithState = async (_prevState: any, formData: FormData) => await deleteDocType(formData)

    const [addState, addAction] = useActionState(addDocTypeWithState, null)
    const [deleteState, deleteAction] = useActionState(deleteDocTypeWithState, null)

    useEffect(() => {
        if (addState?.success) {
            toast.success('Document type added')
            setTypes(prev => [
                ...prev,
                {
                    id: Date.now(), // temporary ID
                    type: newType,
                    count: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ])
            setNewType('')
        } else if (addState?.error) {
            toast.error(addState.error)
        }
    }, [addState])

    useEffect(() => {
        if (deleteState?.success && deleteState.id) {
            toast.success('Document type deleted')
            setTypes(prev => prev.filter(t => t.id !== deleteState.id))
        } else if (deleteState?.error) {
            toast.error(deleteState.error)
        }
        setLoadingId(null)
    }, [deleteState])

    const handleConfirmDelete = (id: number) => {
        setSelectedId(id)
        setConfirmDialogOpen(true)
    }

    const handleDelete = () => {
        if (selectedId !== null) {
            const formData = new FormData()
            formData.append('id', selectedId.toString())
            setLoadingId(selectedId)
            startTransition(() => {
                deleteAction(formData)
            })
            setConfirmDialogOpen(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Document Types</h2>
            </div>

            <form action={addAction} className="flex items-center gap-2">
                <Input
                    name="type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="Enter new type"
                />
                <SubmitButton>Add</SubmitButton>
            </form>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Documents</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {types.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell>{t.id}</TableCell>
                                <TableCell>{t.type}</TableCell>
                                <TableCell>{t.count ?? 0}</TableCell>
                                <TableCell>
                                    {new Date(t.createdAt).toLocaleString("en-IN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                        hour12: true,
                                    })}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:bg-red-600"
                                        onClick={() => handleConfirmDelete(t.id)}
                                        disabled={loadingId === t.id}
                                    >
                                        {loadingId === t.id ? (
                                            <span className="animate-spin">⏳</span>
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the document type.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
