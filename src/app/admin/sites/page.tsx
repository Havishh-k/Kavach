import { getSites } from './actions'
import { SiteDialog } from './site-dialog'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'

export default async function SitesPage() {
    const sites = await getSites()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sites Management</h2>
                    <p className="text-muted-foreground">
                        Manage your active client locations and operational sites.
                    </p>
                </div>
                <SiteDialog />
            </div>

            <DataTable columns={columns} data={sites} searchKey="name" />
        </div>
    )
}
