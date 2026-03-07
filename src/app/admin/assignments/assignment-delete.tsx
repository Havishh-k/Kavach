'use client'

import { Button } from '@/components/ui/button'
import { deleteAssignment } from './actions'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTransition } from 'react'

export function DeleteAssignmentButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition()

    function handleDelete() {
        if (confirm('Are you sure you want to remove this assignment?')) {
            startTransition(async () => {
                const result = await deleteAssignment(id)
                if (result.success) {
                    toast.success('Assignment removed successfully')
                } else {
                    toast.error(result.error || 'Failed to remove assignment')
                }
            })
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            disabled={isPending}
            onClick={handleDelete}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
