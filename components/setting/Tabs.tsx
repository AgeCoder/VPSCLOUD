"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutGrid, Users, Settings, DatabaseBackup, File } from "lucide-react"

interface SettingsTabsProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    branchesCount?: number
    usersCount?: number
    doctypesCount?: number
}

export function Tabs({
    activeTab,
    setActiveTab,
    branchesCount,
    usersCount,
    doctypesCount
}: SettingsTabsProps) {
    const tabs = [
        {
            id: 'doctypes',
            icon: <File className="h-4 w-4" />,
            label: 'Doc Types',
            count: activeTab === 'doctypes' ? doctypesCount : undefined
        },
        {
            id: 'branches',
            icon: <LayoutGrid className="h-4 w-4" />,
            label: 'Branches',
            count: activeTab === 'branches' ? branchesCount : undefined
        },
        {
            id: 'users',
            icon: <Users className="h-4 w-4" />,
            label: 'Users',
            count: activeTab === 'users' ? usersCount : undefined
        },
        {
            id: 'settings',
            icon: <Settings className="h-4 w-4" />,
            label: 'System Settings'
        },
        {
            id: 'Backup',
            icon: <DatabaseBackup className="h-4 w-4" />,
            label: 'Backup'
        }
    ]

    return (
        <div className="flex items-center gap-1 border-b mb-5">
            {tabs.map((tab) => (
                <Button
                    key={tab.id}
                    variant="ghost"
                    className={cn(
                        "px-4 py-3 rounded-none border-b-2 border-transparent gap-2 transition-colors",
                        "hover:bg-muted/50 hover:text-foreground",
                        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50",
                        activeTab === tab.id && "border-primary text-primary font-medium bg-primary/5"
                    )}
                    onClick={() => setActiveTab(tab.id)}
                >
                    {tab.icon}
                    <span className="whitespace-nowrap">{tab.label}</span>
                    {tab.count !== undefined && (
                        <span className={cn(
                            "ml-1.5 px-1.5 py-0.5 text-xs rounded-full",
                            activeTab === tab.id
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                        )}>
                            {tab.count}
                        </span>
                    )}
                </Button>
            ))}
        </div>
    )
}