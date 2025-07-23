'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SubmitButton } from './SubmitButton'
import { toast } from 'sonner'
import { updateSetting, addSetting, deleteSetting } from '@/app/setting/action'
import { useActionState, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from '@/components/ui/dialog'
import { Label } from '../ui/label'
import { Trash2 } from 'lucide-react'

const CONFIGURATION_SETTINGS = [
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
    'DATABASE_URL',
    'CLOUDFLARE_R2_ENDPOINT',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME'
]

interface SettingsTabProps {
    settings: Array<{
        key: string
        value: string
    }>
}

export function SettingsTab({ settings: initialSettings }: SettingsTabProps) {
    const [settings, setSettings] = useState(initialSettings)
    const [isAdding, setIsAdding] = useState(false)
    const [newSetting, setNewSetting] = useState({ key: '', value: '' })

    const [updateState, updateAction] = useActionState(
        async (_: any, formData: FormData) => await updateSetting(formData),
        null
    )

    const [addState, addAction] = useActionState(
        async (_: any, formData: FormData) => await addSetting(formData),
        null
    )

    const [deleteState, deleteAction] = useActionState(
        async (_: any, formData: FormData) => await deleteSetting(formData),
        null
    )

    useEffect(() => {
        if (updateState?.success) {
            toast.success('Setting updated successfully')
            window.location.reload()
        } else if (updateState?.error) {
            toast.error(updateState.error)
        }
    }, [updateState])

    useEffect(() => {
        if (addState?.success) {
            toast.success('Setting added successfully')
            setSettings(prev => [...prev, { ...newSetting }])
            setNewSetting({ key: '', value: '' })
            setIsAdding(false)
        } else if (addState?.error) {
            toast.error(addState.error)
        }
    }, [addState])

    useEffect(() => {
        if (deleteState?.success && deleteState.key) {
            toast.success('Setting deleted successfully')
            setSettings(prev => prev.filter(s => s.key !== deleteState.key))
        } else if (deleteState?.error) {
            toast.error(deleteState.error)
        }
    }, [deleteState])

    const isConfigSetting = (key: string) => CONFIGURATION_SETTINGS.includes(key)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">System Settings</h2>
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <Button size="sm">Add Setting</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Setting</DialogTitle>
                        </DialogHeader>
                        <form action={addAction} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Key</Label>
                                <Input
                                    name="key"
                                    value={newSetting.key}
                                    onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                                    placeholder="SETTING_KEY"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Value</Label>
                                <Input
                                    name="value"
                                    value={newSetting.value}
                                    onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                                    placeholder="Setting value"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <SubmitButton>Add Setting</SubmitButton>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Key</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead className="w-[150px]">Type</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {settings.map((setting) => (
                            <TableRow key={setting.key}>
                                <TableCell className="font-medium">{setting.key}</TableCell>
                                <TableCell>
                                    <form action={updateAction} className="flex items-center gap-2">
                                        <input type="hidden" name="key" value={setting.key} />
                                        <Input
                                            type={setting.key.includes('PASSWORD') ? 'password' : 'text'}
                                            name="value"
                                            defaultValue={setting.value}
                                            className="w-full"
                                        />
                                        <SubmitButton size="sm" variant="outline">Save</SubmitButton>
                                    </form>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={isConfigSetting(setting.key) ? "default" : "outline"}>
                                        {isConfigSetting(setting.key) ? "Config" : "System"}
                                    </Badge>
                                </TableCell>
                                {/* <TableCell>
                                    <form action={deleteAction}>
                                        <input type="hidden" name="key" value={setting.key} />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            type="submit"
                                            className="text-red-500 hover:bg-red-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </TableCell> */}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
