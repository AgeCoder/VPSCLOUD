import { LoadDataFromServer } from "./action"
import SettingsPage from "./main"

export default async function Setting() {
    const { session, branches, users, settings } = await LoadDataFromServer()

    return (
        <SettingsPage
            session={session}
            branches={branches}
            users={users}
            settings={settings}
        />
    )
}
