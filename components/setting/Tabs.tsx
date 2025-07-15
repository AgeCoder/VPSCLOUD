import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutGrid, Users, Settings, DatabaseBackup } from "lucide-react"

interface SettingsTabsProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    branchesCount?: number
    usersCount?: number
}

export function Tabs({
    activeTab,
    setActiveTab,
    branchesCount,
    usersCount
}: SettingsTabsProps) {
    return (
        <div className="flex items-center border-b mb-2">
            <Button
                variant="ghost"
                className={cn(
                    "px-4 py-3 rounded-none border-b-2 border-transparent gap-2",
                    activeTab === 'branches' && "border-primary text-primary font-medium bg-primary/5"
                )}
                onClick={() => setActiveTab('branches')}
            >
                <LayoutGrid className="h-4 w-4" />
                Branches
                {activeTab === 'branches' && branchesCount !== undefined && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-primary/10">
                        {branchesCount}
                    </span>
                )}
            </Button>

            <Button
                variant="ghost"
                className={cn(
                    "px-4 py-3 rounded-none border-b-2 border-transparent gap-2",
                    activeTab === 'users' && "border-primary text-primary font-medium bg-primary/5"
                )}
                onClick={() => setActiveTab('users')}
            >
                <Users className="h-4 w-4" />
                Users
                {activeTab === 'users' && usersCount !== undefined && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-primary/10">
                        {usersCount}
                    </span>
                )}
            </Button>

            <Button
                variant="ghost"
                className={cn(
                    "px-4 py-3 rounded-none border-b-2 border-transparent gap-2",
                    activeTab === 'settings' && "border-primary text-primary font-medium bg-primary/5"
                )}
                onClick={() => setActiveTab('settings')}
            >
                <Settings className="h-4 w-4" />
                System Settings
            </Button>
            <Button
                variant="ghost"
                className={cn(
                    "px-4 py-3 rounded-none border-b-2 border-transparent gap-2",
                    activeTab === 'Backup' && "border-primary text-primary font-medium bg-primary/5"
                )}
                onClick={() => setActiveTab('Backup')}
            >
                <DatabaseBackup className="h-4 w-4" />
                Backup
            </Button>
        </div>
    )
}