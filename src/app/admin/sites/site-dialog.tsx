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
import { createSite, updateSite } from './actions'
import { toast } from 'sonner'
import { Plus, Edit2 } from 'lucide-react'

export type Site = {
    id: string
    name: string
    address: string
    contact_person: string | null
    contact_phone: string | null
}

export function SiteDialog({ site }: { site?: Site }) {
    const [open, setOpen] = useState(false)
    const isEditing = !!site

    async function onSubmit(formData: FormData) {
        let result
        if (isEditing) {
            result = await updateSite(site.id, formData)
        } else {
            result = await createSite(formData)
        }

        if (result.success) {
            toast.success(isEditing ? 'Site updated.' : 'Site added.')
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
                        <Plus className="h-4 w-4 mr-2" /> Add Site
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Site' : 'Add Site'}</DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Update the details for this security site.'
                                : 'Enter the details to register a new client site.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Site Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={site?.name}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Full Address *</Label>
                            <Input
                                id="address"
                                name="address"
                                defaultValue={site?.address}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="contact_person">Contact Person</Label>
                                <Input
                                    id="contact_person"
                                    name="contact_person"
                                    defaultValue={site?.contact_person || ''}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contact_phone">Contact Phone</Label>
                                <Input
                                    id="contact_phone"
                                    name="contact_phone"
                                    defaultValue={site?.contact_phone || ''}
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
