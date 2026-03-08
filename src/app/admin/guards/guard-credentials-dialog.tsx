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
import { setGuardAuthCredentials } from './actions'
import { toast } from 'sonner'
import { Key } from 'lucide-react'
import type { Guard } from './columns'

export function GuardCredentialsDialog({ guard }: { guard: Guard }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const result = await setGuardAuthCredentials(guard.id, email, password)

        if (result.success) {
            toast.success('Login credentials saved successfully.')
            setOpen(false)
        } else {
            toast.error(result.error || 'Failed to update credentials.')
        }
        setIsLoading(false)
    }

    // Attempt to parse out a default email based on phone or name
    const defaultEmail = guard.phone
        ? `${guard.phone}@kavachsecurities.com`
        : `${guard.full_name.toLowerCase().replace(/\s+/g, '.')}@kavachsecurities.com`

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 text-neutral-400 hover:text-white border-neutral-800">
                    <Key className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Set Guard Login</DialogTitle>
                        <DialogDescription>
                            Assign a login email and password for {guard.full_name} so they can access the Guard App.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Identity</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={defaultEmail}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="text"
                                placeholder="Enter a secure password"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Credentials'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
