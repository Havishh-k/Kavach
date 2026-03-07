'use client'

import { ColumnDef } from '@tanstack/react-table'
import { AssignmentDialog } from './assignment-dialog'
import { DeleteAssignmentButton } from './assignment-delete'
import { format } from 'date-fns'

const formatRate = (amt: number, type: string) => {
    const suffix = type === 'monthly' ? '/mo' : '/hr'
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amt) + suffix
}

export const getColumns = (availableGuards: any[], availableSites: any[]): ColumnDef<any>[] => [
    {
        accessorFn: (r) => r.guards?.full_name, // So we can search by `full_name` 
        id: 'guard_name',
        header: 'Guard Name',
        cell: ({ row }) => {
            const assignment = row.original
            return (
                <div className="font-medium flex items-center">
                    {assignment.guards?.full_name || 'Unknown Guard'}
                    {!assignment.guards?.is_active && <span className="text-xs text-red-500 ml-2">(Inactive)</span>}
                </div>
            )
        },
    },
    {
        accessorFn: (r) => r.sites?.name,
        id: 'site_location',
        header: 'Site Location',
        cell: ({ row }) => {
            const assignment = row.original
            return (
                <div className="flex items-center">
                    {assignment.sites?.name || 'Unknown Site'}
                    {!assignment.sites?.is_active && <span className="text-xs text-red-500 ml-2">(Inactive)</span>}
                </div>
            )
        },
    },
    {
        id: 'duration',
        header: 'Duration',
        cell: ({ row }) => {
            const assignment = row.original
            return (
                <div>
                    {format(new Date(assignment.start_date), 'MMM d, yyyy')} -
                    {assignment.end_date ? ` ${format(new Date(assignment.end_date), 'MMM d, yyyy')}` : ' Ongoing'}
                </div>
            )
        },
    },
    {
        id: 'shift_timing',
        header: 'Shift Timing',
        cell: ({ row }) => {
            const assignment = row.original
            return (
                <div>
                    {assignment.shift_start_time.slice(0, 5)} to {assignment.shift_end_time.slice(0, 5)}
                </div>
            )
        },
    },
    {
        id: 'compensation',
        header: () => <div className="text-right">Compensation</div>,
        cell: ({ row }) => {
            const assignment = row.original
            return (
                <div className="text-right">
                    {assignment.hourly_rate
                        ? formatRate(assignment.hourly_rate, assignment.payment_type || 'hourly')
                        : 'N/A'}
                </div>
            )
        },
    },
    {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
            const assignment = row.original
            return (
                <div className="flex justify-end items-center gap-2">
                    <AssignmentDialog
                        assignment={assignment}
                        availableGuards={availableGuards}
                        availableSites={availableSites}
                    />
                    <DeleteAssignmentButton id={assignment.id} />
                </div>
            )
        },
    },
]
