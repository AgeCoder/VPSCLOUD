// app/settings/components/BranchTab.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubmitButton } from './SubmitButton'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { addBranch, deleteBranch, updateBranch } from '@/app/setting/action'
import { useActionState } from 'react'

interface BranchTabProps {
    branches: any[]
    session: any
}

import { useEffect } from "react"

export function BranchTab({ branches, session }: BranchTabProps) {
    const [addBranchState, addBranchAction] = useActionState(
        async (_state: any, formData: FormData) => await addBranch(formData),
        null
    )
    // import delte and update from action
    const [deleteBranchState, deleteBranchAction] = useActionState(
        async (_state: any, formData: FormData) => await deleteBranch(formData),
        null
    )
    const [updateBranchState, updateBranchAction] = useActionState(
        async (_state: any, formData: FormData) => await updateBranch(formData),
        null
    )

    useEffect(() => {
        if (addBranchState?.success) {
            toast.success(addBranchState.message)
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

    useEffect(() => {
        if (updateBranchState?.success) {
            toast.success(updateBranchState.message)
        } else if (updateBranchState?.success === false) {
            toast.error(updateBranchState.message)
        }
    }, [updateBranchState])

    return (
        <div
            className='mb-32 mx-12'
        >
            <h2 className="text-xl font-semibold mb-4">Branch Management</h2>

            {session.user.role === 'admin' && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Add New Branch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={addBranchAction} className="flex gap-4">
                            <Input
                                type="text"
                                name="name"
                                placeholder="Branch Name"
                                required
                            />
                            <Input
                                type="text"
                                name="zone"
                                placeholder="Zone"
                                required
                            />
                            <SubmitButton>Add Branch</SubmitButton>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <Table className="w-full border rounded- shadow-sm">
                    <TableHeader >
                        <TableRow>
                            <TableHead className="text-sm font-medium text-gray-700">
                                ID
                            </TableHead>
                            <TableHead className="text-sm font-medium text-gray-700">Name</TableHead>
                            <TableHead className="text-sm font-medium text-gray-700">Zone</TableHead>
                            {session.user.role === 'admin' && (
                                <TableHead className="text-sm font-medium text-gray-700">Actions</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {branches.map((branch) => (
                            <TableRow key={branch.id} className="hover:bg-gray-700 transition ">
                                <TableCell className="py-2 px-4 text-sm">{branch.id}</TableCell>
                                <TableCell className="py-2 px-4 text-sm">{branch.name}</TableCell>
                                <TableCell className="py-2 px-4 text-sm">{branch.zone}</TableCell>
                                {session.user.role === 'admin' && (
                                    <TableCell className="py-2 px-4 text-sm space-x-2">
                                        {/* Optional: Update branch (show if needed) */}
                                        {/* <form action={updateBranchAction} className="inline-flex gap-2">
                                            <Input type="hidden" name="name" value={branch.name} />
                                            <Input
                                                type="text"
                                                name="zone"
                                                defaultValue={branch.zone}
                                                required
                                                className="h-8 text-sm"
                                            />
                                            <Button type="submit" variant="outline" size="sm">
                                                Update
                                            </Button>
                                        </form> */}

                                        {/* Delete branch */}
                                        <form action={deleteBranchAction} className="inline-block">
                                            <input type="hidden" name="name" value={branch.name} />
                                            <Button type="submit" variant="destructive" size="sm">
                                                Delete
                                            </Button>
                                        </form>
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