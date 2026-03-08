'use client'

import { ColumnDef } from '@tanstack/react-table'
import { GuardDialog } from './guard-dialog'
import { DeleteGuardButton } from './guard-delete'
import { GuardCredentialsDialog } from './guard-credentials-dialog'

// Define the shape of our data.
export type Guard = {
    id: string
    full_name: string
    phone: string | null
    address: string | null
    id_card_number: string | null
    id_issue_date: string | null
    id_expiry_date: string | null
    is_active: boolean
    created_at: string
}

export const columns: ColumnDef<Guard>[] = [
    {
        accessorKey: 'full_name',
        header: 'Name',
        cell: ({ row }) => <div className="font-medium">{row.getValue('full_name')}</div>,
    },
    {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => <div>{row.getValue('phone') || 'N/A'}</div>,
    },
    {
        accessorKey: 'id_card_number',
        header: 'ID Number',
        cell: ({ row }) => <div>{row.getValue('id_card_number') || 'N/A'}</div>,
    },
    {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
            const guard = row.original
            return (
                <div className="flex justify-end items-center gap-2">
                    <GuardCredentialsDialog guard={guard} />
                    <GuardDialog guard={guard} />
                    <DeleteGuardButton id={guard.id} />
                </div>
            )
        },
    },
]
