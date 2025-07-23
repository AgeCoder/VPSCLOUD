import { LoadDataFromServer } from "./action"
import SettingsPage from "./main"

export default async function Setting() {
    const { session, branches, users, settings, doctypes } = await LoadDataFromServer()

    const ZONE_MAPPING = branches.reduce((acc, branch) => {
        if (!acc[branch.zone]) {
            acc[branch.zone] = []
        }
        acc[branch.zone].push(branch.name)
        return acc
    }, {} as Record<string, string[]>)


    return (
        <SettingsPage
            session={session}
            branches={branches}
            users={users}
            settings={settings}
            ZONE_MAPPING={ZONE_MAPPING}
            doctypes={doctypes}
        />
    )
}
