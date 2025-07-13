// app/settings/components/UserTab.tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Users, Plus, Trash2, Pencil } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { UserEditModal } from './UserEditModal'
import { getBranchesByZone, ZONE_MAPPING } from "@/lib/zones"
import { Checkbox } from '../ui/checkbox'

type UserRole = 'admin' | 'zone' | 'branch'

interface User {
    id: string
    email: string
    role: UserRole
    zone: string | null
    branch: string | null
    canUpload: boolean
    createdAt: string
    updatedAt: string
}

interface Branch {
    id: string
    name: string
    zone: string
}

interface UserTabProps {
    users: User[]
    branches: Branch[]
    session: {
        user: {
            role: UserRole
            id: string
        }
    }
}

export function UserTab({ users: initialUsers, branches, session }: UserTabProps) {
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [isCreatingUser, setIsCreatingUser] = useState(false)
    const [newUser, setNewUser] = useState({
        email: "",
        role: "branch" as UserRole,
        zone: "",
        branch: "",
        canUpload: false,
    })
    const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})

    const handleCreateUser = async () => {
        if (!newUser.email.trim()) {
            toast.error("Email is required")
            return
        }

        if (newUser.role !== 'admin' && !newUser.zone) {
            toast.error("Zone is required for non-admin users")
            return
        }

        if (newUser.role === 'branch' && !newUser.branch) {
            toast.error("Branch is required for branch users")
            return
        }

        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newUser),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to create user")
            }

            const data = await response.json()
            setUsers(prev => [...prev, data.user])
            setNewUser({
                email: "",
                role: "branch",
                zone: "",
                branch: "",
                canUpload: false,
            })
            setIsCreatingUser(false)
            toast.success("User created successfully")
        } catch (error) {
            console.error("Error creating user:", error)
            toast.error(error instanceof Error ? error.message : "Failed to create user")
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (session.user.id === userId) {
            toast.error("You cannot delete your own account")
            return
        }

        setIsDeleting(prev => ({ ...prev, [userId]: true }))

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to delete user")
            }

            setUsers(prev => prev.filter(user => user.id !== userId))
            toast.success("User deleted successfully")
        } catch (error) {
            console.error("Error deleting user:", error)
            toast.error(error instanceof Error ? error.message : "Failed to delete user")
        } finally {
            setIsDeleting(prev => ({ ...prev, [userId]: false }))
        }
    }

    const filteredBranches = newUser.zone
        ? branches.filter(b => b.zone === newUser.zone)
        : []

    const handleUserUpdated = (updatedUser: User) => {
        setUsers(prev =>
            prev.map(user => user.id === updatedUser.id ? updatedUser : user)
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">User Management</h2>
                <Dialog open={isCreatingUser} onOpenChange={setIsCreatingUser}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="user@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={newUser.role}
                                    onValueChange={(value: UserRole) => {
                                        setNewUser({
                                            ...newUser,
                                            role: value,
                                            ...(value === 'admin' ? { zone: '', branch: '' } : {}),
                                            ...(value === 'zone' ? { branch: '' } : {})
                                        })
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="zone">Zone Manager</SelectItem>
                                        <SelectItem value="branch">Branch User</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {newUser.role !== 'admin' && (
                                <div className="space-y-2">
                                    <Label htmlFor="zone">Zone</Label>
                                    <Select
                                        value={newUser.zone}
                                        onValueChange={(value) => setNewUser({
                                            ...newUser,
                                            zone: value,
                                            ...(newUser.role === 'branch' ? { branch: '' } : {})
                                        })}
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
                            )}

                            {newUser.role === 'branch' && newUser.zone && (
                                <div className="space-y-2">
                                    <Label htmlFor="branch">Branch</Label>
                                    <Select
                                        value={newUser.branch}
                                        onValueChange={(value) => setNewUser({ ...newUser, branch: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredBranches.map(branch => (
                                                <SelectItem key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="canUpload"
                                    checked={newUser.canUpload}
                                    onCheckedChange={(checked) =>
                                        setNewUser({ ...newUser, canUpload: Boolean(checked) })
                                    }
                                />
                                <Label htmlFor="canUpload">Allow file uploads</Label>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button onClick={handleCreateUser}>
                                    Create User
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Zone</TableHead>
                            <TableHead>Upload</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="capitalize">
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.branch || '-'}</TableCell>
                                    <TableCell>{user.zone || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.canUpload ? "default" : "outline"}>
                                            {user.canUpload ? "Allowed" : "Not Allowed"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingUser(user)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                        {user.role !== 'admin' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={isDeleting[user.id]}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {isDeleting[user.id] ? "Deleting..." : "Delete"}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No users found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {editingUser && (
                <UserEditModal
                    user={editingUser}
                    branches={branches}
                    onClose={() => setEditingUser(null)}
                />
            )}
        </div>
    )
}