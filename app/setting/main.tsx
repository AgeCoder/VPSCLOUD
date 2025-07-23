// app/settings/page.tsx
'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BranchTab } from '@/components/setting/BranchTab'
import { UserTab } from '@/components/setting/UserTab'
import { SettingsTab } from '@/components/setting/SettingsTab'
import { Tabs } from '@/components/setting/Tabs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { BackupSettings } from '@/components/backup/backup-settings'
import { DocTypeTab } from '@/components/setting/DocTypeTab'

interface SettingsPageProps {
    session: any
    branches: any[]
    users: any[]
    settings: any[]
    ZONE_MAPPING: Record<string, string[]>
    doctypes: any[]
}

export default function SettingsPage({
    session,
    branches,
    users,
    settings,
    ZONE_MAPPING,
    doctypes
}: SettingsPageProps) {
    const [activeTab, setActiveTab] = useState('doctypes')

    if (!session) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>
    }

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <div
                className='flex w-full justify-between items-center'
            >
                <h1 className="text-2xl font-bold mb-6">Settings</h1>
                <Link
                    href='/dashboard'
                >
                    <Button>
                        <ArrowLeft
                            size={32}
                        />
                        Dashboard
                    </Button>
                </Link>
            </div>

            {session.user.role !== 'admin' && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>
                        You have limited access based on your {session.user.role} role.
                    </AlertDescription>
                </Alert>
            )}

            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} branchesCount={branches.length}
                usersCount={users.length} doctypesCount={doctypes.length} />

            {activeTab === 'doctypes' && <DocTypeTab
                initialTypes={doctypes}
            />}
            {activeTab === 'branches' && <BranchTab branches={branches} session={session} />}
            {activeTab === 'users' && <UserTab users={users} branches={branches} session={session} ZONE_MAPPING={ZONE_MAPPING} />}
            {activeTab === 'settings' && <SettingsTab settings={settings} />}
            {activeTab === 'Backup' && <BackupSettings />}
        </div>
    )
}