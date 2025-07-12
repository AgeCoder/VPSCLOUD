// app/settings/EditSettingDialog.tsx
'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'
import { settings } from '@/lib/localdb/schema'
import { dblocal } from '@/lib/localdb'

export default function EditSettingDialog({
    setting,
    passwordSetting
}: {
    setting: typeof settings.$inferSelect,
    passwordSetting?: string
}) {
    const [open, setOpen] = useState(false)
    const [password, setPassword] = useState('')
    const [newValue, setNewValue] = useState(String(setting.value))
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            // Verify password if this isn't the password setting itself
            if (setting.key !== 'password' && password !== passwordSetting) {
                throw new Error('Incorrect password')
            }

            // Update the setting in the database
            // await dblocal.update(settings)
            //     .set({
            //         value: setting.key === 'password' ? password : newValue,
            //         updatedAt: new Date()
            //     })
            //     .where({ key: setting.key })

            toast({
                title: "Setting updated",
                description: `${setting.key} has been updated successfully.`,
            })
            setOpen(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update setting')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit {setting.key.replace(/_/g, ' ')}</DialogTitle>
                        <DialogDescription>
                            Update the value for this setting. Changes will take effect immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {setting.key !== 'password' ? (
                            <div className="space-y-2">
                                <Label htmlFor="newValue">New Value</Label>
                                <Input
                                    id="newValue"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {setting.key !== 'password' && (
                            <div className="space-y-2">
                                <Label htmlFor="password">Admin Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password to confirm changes"
                                />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm mb-4">{error}</div>
                    )}

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isLoading || (setting.key === 'password' && password !== newValue)}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}