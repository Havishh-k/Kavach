import { getGuards } from './actions'
import { GuardDialog } from './guard-dialog'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'

export default async function GuardsPage() {
    const guards = await getGuards()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Guards Management</h2>
                    <p className="text-muted-foreground">
                        Manage your active security guards, contacts, and IDs.
                    </p>
                </div>
                <GuardDialog />
            </div>

            <DataTable columns={columns} data={guards} searchKey="full_name" />
        </div>
    )
}
