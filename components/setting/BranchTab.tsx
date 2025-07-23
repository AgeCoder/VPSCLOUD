'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { SubmitButton } from './SubmitButton'
import { addBranch, deleteBranch } from '@/app/setting/action'
import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

interface Branch {
    id: string
    name: string
    zone: string
}

interface SessionUser {
    role: string
}

interface Session {
    user: SessionUser
}

interface BranchTabProps {
    branches: Branch[]
    session: Session
}

export function BranchTab({ branches, session }: BranchTabProps) {
    const [zone, setZone] = useState('')
    const [branchName, setBranchName] = useState('')
    const [zones, setZones] = useState<string[]>([])
    const [newZoneInput, setNewZoneInput] = useState('')
    const [showNewZoneInput, setShowNewZoneInput] = useState(false)
    const [openDialog, setOpenDialog] = useState(false)

    useEffect(() => {
        const uniqueZones = [...new Set(branches.map((b) => b.zone))].sort()
        setZones(uniqueZones)
    }, [branches])

    const [addBranchState, addBranchAction] = useActionState(
        async (_state: any, formData: FormData) => {
            try {
                return await addBranch(formData)
            } catch (error) {
                return { success: false, message: 'Failed to add branch' }
            }
        },
        null
    )

    const [deleteBranchState, deleteBranchAction] = useActionState(
        async (_state: any, formData: FormData) => {
            try {
                return await deleteBranch(formData)
            } catch (error) {
                return { success: false, message: 'Failed to delete branch' }
            }
        },
        null
    )

    useEffect(() => {
        if (addBranchState?.success) {
            toast.success(addBranchState.message)
            setZone('')
            setBranchName('')
            setNewZoneInput('')
            setShowNewZoneInput(false)
            setOpenDialog(false)
        } else if (addBranchState?.success === false) {
            toast.error(addBranchState.message)
        }
    }, [addBranchState])

    useEffect(() => {
        if (deleteBranchState?.success) {
            toast.success(deleteBranchState.message)
        } else if (deleteBranchState?.success === false) {
            toast.error(deleteBranchState.message)
        }
    }, [deleteBranchState])

    return (
        <div className="mb-32 mx-4 md:mx-12">
            <h2 className="text-xl font-semibold mb-4">Branch Management</h2>

            {session.user.role === 'admin' && (
                <div className="mb-6 w-full flex justify-end">
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                            <Button>Add New Branch</Button>
                        </DialogTrigger>

                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Branch</DialogTitle>
                                <DialogDescription>
                                    Select a zone or add a new one, and enter the branch name.
                                </DialogDescription>
                            </DialogHeader>

                            <form action={addBranchAction} className="space-y-4">
                                <input
                                    type="hidden"
                                    name="zone"
                                    value={showNewZoneInput ? newZoneInput : zone}
                                />

                                {!showNewZoneInput ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="zone-select">Zone</Label>
                                        <Select
                                            value={zone}
                                            onValueChange={(value) => {
                                                if (value === '__add_new__') {
                                                    setShowNewZoneInput(true)
                                                    setZone('')
                                                } else {
                                                    setZone(value)
                                                }
                                            }}
                                        >
                                            <SelectTrigger id="zone-select">
                                                <SelectValue placeholder="Select zone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {zones.map((z) => (
                                                    <SelectItem key={z} value={z}>
                                                        {z}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="__add_new__" className="text-blue-600">
                                                    Add New Zone
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="new-zone">New Zone</Label>
                                        <Input
                                            id="new-zone"
                                            value={newZoneInput}
                                            onChange={(e) => setNewZoneInput(e.target.value)}
                                            placeholder="Enter new zone name"
                                            required
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="mt-1 text-sm text-blue-500"
                                            onClick={() => {
                                                setShowNewZoneInput(false)
                                                setNewZoneInput('')
                                            }}
                                        >
                                            ← Back to zone list
                                        </Button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="branch-name">Branch Name</Label>
                                    <Input
                                        id="branch-name"
                                        type="text"
                                        name="name"
                                        value={branchName}
                                        onChange={(e) => setBranchName(e.target.value.toUpperCase())}
                                        placeholder="Branch Name"
                                        required
                                        className="uppercase"
                                    />
                                </div>

                                <DialogFooter>
                                    <SubmitButton
                                        disabled={
                                            (showNewZoneInput && !newZoneInput.trim()) ||
                                            (!showNewZoneInput && !zone.trim()) ||
                                            !branchName.trim()
                                        }
                                    >
                                        Add Branch
                                    </SubmitButton>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Zone</TableHead>
                            {session.user.role === 'admin' && <TableHead>Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {branches.map((branch) => (
                            <TableRow key={branch.id}>
                                <TableCell>{branch.id}</TableCell>
                                <TableCell>{branch.name}</TableCell>
                                <TableCell>{branch.zone}</TableCell>
                                {session.user.role === 'admin' && (
                                    <TableCell>
                                        <DeleteBranchDialog
                                            branchName={branch.name}
                                            onConfirm={async () => {
                                                const formData = new FormData()
                                                formData.append('name', branch.name)
                                                await deleteBranchAction(formData)
                                            }}
                                        />
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}

interface DeleteBranchDialogProps {
    branchName: string
    onConfirm: () => Promise<void>
}

function DeleteBranchDialog({ branchName, onConfirm }: DeleteBranchDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        setLoading(true)
        try {
            await onConfirm()
        } finally {
            setLoading(false)
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    Delete
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{branchName}</strong>?
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}