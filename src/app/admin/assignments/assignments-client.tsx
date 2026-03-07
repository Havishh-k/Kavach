'use client'

import { DataTable } from '@/components/ui/data-table'
import { getColumns } from './columns'
import { AssignmentDialog } from './assignment-dialog'

export function AssignmentsClient({
    assignments,
    availableGuards,
    availableSites
}: {
    assignments: any[]
    availableGuards: any[]
    availableSites: any[]
}) {
    const columns = getColumns(availableGuards, availableSites)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Assignments Management</h2>
                    <p className="text-muted-foreground">
                        Deploy your active guards to corresponding sites.
                    </p>
                </div>
                <AssignmentDialog
                    availableGuards={availableGuards}
                    availableSites={availableSites}
                />
            </div>

            <DataTable columns={columns} data={assignments} searchKey="guard_name" />
        </div>
    )
}
