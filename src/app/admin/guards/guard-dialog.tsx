'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createGuard, updateGuard } from './actions'
import { toast } from 'sonner'
import { Plus, Edit2 } from 'lucide-react'

export type Guard = {
    id: string
    full_name: string
    phone: string | null
    address: string | null
    id_card_number: string | null
    id_issue_date: string | null
    id_expiry_date: string | null
}

export function GuardDialog({ guard }: { guard?: Guard }) {
    const [open, setOpen] = useState(false)
    const isEditing = !!guard

    async function onSubmit(formData: FormData) {
        let result
        if (isEditing) {
            result = await updateGuard(guard.id, formData)
        } else {
            result = await createGuard(formData)
        }

        if (result.success) {
            toast.success(isEditing ? 'Guard updated.' : 'Guard added.')
            setOpen(false)
        } else {
            toast.error(result.error || 'Operation failed')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="ghost" size="icon">
                        <Edit2 className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" /> Add Guard
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Guard' : 'Add Guard'}</DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Update the details for this security guard.'
                                : 'Enter the details to register a new security guard.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input
                                id="full_name"
                                name="full_name"
                                defaultValue={guard?.full_name}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                defaultValue={guard?.phone || ''}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                defaultValue={guard?.address || ''}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="id_card_number">ID Card #</Label>
                                <Input
                                    id="id_card_number"
                                    name="id_card_number"
                                    defaultValue={guard?.id_card_number || ''}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="id_expiry_date">Expiry Date</Label>
                                <Input
                                    id="id_expiry_date"
                                    name="id_expiry_date"
                                    type="date"
                                    defaultValue={guard?.id_expiry_date || ''}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
