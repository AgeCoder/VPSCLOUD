// app/settings/components/SettingsTab.tsx
'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SubmitButton } from './SubmitButton'
import { toast } from 'sonner'
import { updateSetting, addSetting } from '@/app/setting/action'
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

const CONFIGURATION_SETTINGS = [
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
    'DATABASE_URL',
    'CLOUDFLARE_R2_ENDPOINT',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME'
]

const DOCUMENT_TYPE_PREFIX = 'DOC_TYPE_'

interface SettingsTabProps {
    settings: Array<{
        key: string
        value: string
        isDocumentType?: boolean
    }>
}

export function SettingsTab({ settings: initialSettings }: SettingsTabProps) {
    const [settings, setSettings] = useState(initialSettings)
    const [isAdding, setIsAdding] = useState(false)
    const [newSetting, setNewSetting] = useState({
        key: '',
        value: '',
        isDocumentType: false
    })

    const [updateState, updateAction] = useActionState(
        async (_state: any, formData: FormData) => await updateSetting(formData),
        null
    )

    const [addState, addAction] = useActionState(
        async (_state: any, formData: FormData) => await addSetting(formData),
        null
    )

    useEffect(() => {
        if (updateState?.success) {
            toast.success('Setting updated successfully')
        } else if (!updateState?.success) {
            toast.error(updateState?.message ?? '')
        }
    }, [updateState])

    useEffect(() => {
        if (addState?.success) {
            toast.success('Setting added successfully')
            setSettings(prev => [...prev, {
                key: newSetting.key,
                value: newSetting.value,
                isDocumentType: newSetting.isDocumentType
            }])
            setNewSetting({ key: '', value: '', isDocumentType: false })
            setIsAdding(false)
        } else if (addState?.error) {
            toast.error(addState?.error ?? '')
        }
    }, [addState])

    const isConfigSetting = (key: string) => CONFIGURATION_SETTINGS.includes(key)
    const isDocumentType = (key: string) => key.startsWith(DOCUMENT_TYPE_PREFIX)





    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">System Settings</h2>
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            Add Setting
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Setting</DialogTitle>
                        </DialogHeader>
                        <form action={addAction} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Key</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        name="key"
                                        value={newSetting.key}
                                        onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                                        placeholder={newSetting.isDocumentType ? "Document Type" : "SETTING_KEY"}
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Value</Label>
                                {newSetting.isDocumentType ? (
                                    <Input
                                        name="value"
                                        value='DOC_TYPE_'
                                        disabled
                                        placeholder="Setting value"
                                    />
                                ) : (
                                    <Input
                                        name="value"
                                        value={newSetting.value}
                                        onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                                        placeholder="Setting value"
                                    />
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isDocumentType"
                                    name="isDocumentType"
                                    checked={newSetting.isDocumentType}
                                    onChange={(e) => {
                                        const isDocumentType = e.target.checked
                                        setNewSetting({
                                            ...newSetting,
                                            isDocumentType,
                                            value: isDocumentType ? "DOC_TYPE_" : "" // Set default value when checked
                                        })
                                    }}
                                    className="h-4 w-4"
                                />
                                <Label htmlFor="isDocumentType">Document Type</Label>
                            </div>

                            <input
                                type="hidden"
                                name="finalKey"
                                value={newSetting.key
                                }
                            />

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
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        {setting.key}
                                        {isDocumentType(setting.key) && (
                                            <Badge variant="secondary">Document</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {isConfigSetting(setting.key) || isDocumentType(setting.key) ? (
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
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={setting.value}
                                                readOnly
                                                className="w-full bg-muted"
                                            />
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {isConfigSetting(setting.key) ? (
                                        <Badge variant="default">Config</Badge>
                                    ) : isDocumentType(setting.key) ? (
                                        <Badge variant="secondary">Document Type</Badge>
                                    ) : (
                                        <Badge variant="outline">System</Badge>
                                    )}
                                </TableCell>
                                <TableCell>

                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}