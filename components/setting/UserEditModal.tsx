'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, User, Shield, Upload } from 'lucide-react'
import { updateUser } from '@/app/setting/action'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { SubmitButton } from './SubmitButton'
import { Badge } from '@/components/ui/badge'

interface UserEditModalProps {
    user: any
    branches: any[]
    onClose: () => void
    ZONE_MAPPING: Record<string, string[]
    >
    handleUserUpdated: (updatedUser: any) => void
}

export function UserEditModal({ user, branches, onClose, ZONE_MAPPING, handleUserUpdated }: UserEditModalProps) {
    const [updateUserState, updateUserAction] = useActionState(
        async (_prevState: any, formData: FormData) => await updateUser(formData),
        null
    )

    const [selectedZone, setSelectedZone] = useState(user.zone || 'none')
    const [selectedBranch, setSelectedBranch] = useState(user.branch || 'none')
    const [selectedRole, setSelectedRole] = useState(user.role);


    const filteredBranches = selectedZone
        ? branches.filter(b => b.zone === selectedZone)
        : branches

    useEffect(() => {
        if (updateUserState?.success) {
            handleUserUpdated(updateUserState.user)
            toast.success('User updated successfully', {
                description: updateUserState.message
            })
            onClose()
        } else if (updateUserState?.success === false) {
            toast.error('Failed to update user', {
                description: updateUserState.message
            })
        }
    }, [updateUserState, onClose])

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>Edit User Profile</DialogTitle>
                            <DialogDescription>
                                Update user permissions and details
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form action={updateUserAction} className="space-y-6">
                    <input type="hidden" name="userId" value={user.id} />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={user.email}
                                disabled
                                className="bg-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                name="role"
                                defaultValue={user.role}
                                required
                                onValueChange={(value) => {
                                    setSelectedRole(value);
                                    if (value === 'admin') {
                                        setSelectedZone('');
                                        setSelectedBranch('');
                                    } else if (value === 'zonal_head') {
                                        setSelectedBranch('');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="branch">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" /> Branch User
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="zonal_head">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" /> Zonal Head
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" /> Admin
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="zone">Zone</Label>
                            <Select
                                name="zone"
                                value={selectedZone}
                                onValueChange={(value) => {
                                    setSelectedZone(value);
                                    setSelectedBranch('');
                                }}
                                disabled={selectedRole === 'admin'}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select zone" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(ZONE_MAPPING).map(zone => (
                                        <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="branch">Branch Assignment</Label>
                            <Select
                                name="branch"
                                value={selectedBranch}
                                onValueChange={setSelectedBranch}
                                disabled={!selectedZone || selectedRole !== 'branch'}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent className='h-60'>
                                    <SelectItem value='none'>No branch assigned</SelectItem>
                                    {filteredBranches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.name}>
                                            <div className="flex items-center gap-2">
                                                <span>{branch.name}</span>
                                                <Badge variant="secondary">{branch.zone}</Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <Label>Permissions</Label>
                        <div className="flex items-center space-x-4 rounded-lg border p-4">
                            <Checkbox
                                id="canUpload"
                                name="canUpload"
                                defaultChecked={user.canUpload || false}
                            />
                            <div className="space-y-1">
                                <Label htmlFor="canUpload" className="flex items-center gap-2">
                                    <Upload className="h-4 w-4" /> File Upload Access
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow user to upload documents to the system
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <SubmitButton>
                            <Pencil className="h-4 w-4 mr-2" /> Save Changes
                        </SubmitButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}