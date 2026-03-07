'use client'

import { ColumnDef } from '@tanstack/react-table'
import { SiteDialog } from './site-dialog'
import { DeleteSiteButton } from './site-delete'

export type Site = {
    id: string
    name: string
    address: string
    contact_person: string | null
    contact_phone: string | null
    is_active: boolean
    created_at: string
}

export const columns: ColumnDef<Site>[] = [
    {
        accessorKey: 'name',
        header: 'Site Name',
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'address',
        header: 'Address',
        cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue('address')}</div>,
    },
    {
        accessorKey: 'contact_person',
        header: 'Contact Person',
        cell: ({ row }) => <div>{row.getValue('contact_person') || 'N/A'}</div>,
    },
    {
        accessorKey: 'contact_phone',
        header: 'Contact Phone',
        cell: ({ row }) => <div>{row.getValue('contact_phone') || 'N/A'}</div>,
    },
    {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
            const site = row.original
            return (
                <div className="flex justify-end items-center gap-2">
                    <SiteDialog site={site} />
                    <DeleteSiteButton id={site.id} />
                </div>
            )
        },
    },
]
