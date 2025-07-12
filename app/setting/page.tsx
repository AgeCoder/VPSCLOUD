// app/settings/page.tsx
import { dblocal } from '@/lib/localdb'
import { settings } from '@/lib/localdb/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EditSettingDialog from './EditSettingDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function Setting() {
    const settingList = await dblocal.select().from(settings)
    const passwordSetting = settingList.find(s => s.key === 'password')

    return (
        <div className="p-6  mx-auto space-y-4">
            <Card>
                <CardHeader>
                    <div className='w-full justify-between flex'>
                        <CardTitle className="text-xl font-bold">Application Settings</CardTitle>
                        <Link
                            href='/dashboard'
                        >
                            <Button
                            >
                                <ArrowLeft />
                                Dashboard
                            </Button></Link>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {settingList.map((setting) => (
                    <Card key={setting.key}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold capitalize">{setting.key.replace(/_/g, ' ')}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Last updated: {new Date(setting.updatedAt).toLocaleString()}
                                    </p>
                                </div>
                                {/* <EditSettingDialog
                                    setting={setting}
                                    passwordSetting={passwordSetting?.value as string | undefined}
                                /> */}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Input
                                value={setting.key === 'password' ? '••••••••' : String(setting.value)}
                                disabled
                            />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}