'use client'

import { useEffect } from 'react'
import { useSyncStore } from '@/store/sync-store'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { processOfflineSyncJob } from '@/app/guard/actions'

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const queue = useSyncStore((state) => state.queue)
    const isSyncing = useSyncStore((state) => state.isSyncing)
    const setSyncing = useSyncStore((state) => state.setSyncing)
    const removeJob = useSyncStore((state) => state.removeJob)
    const incrementRetry = useSyncStore((state) => state.incrementRetry)

    const router = useRouter()

    useEffect(() => {
        const flushQueue = async () => {
            if (!navigator.onLine || isSyncing || queue.length === 0) return

            setSyncing(true)
            toast.info(`Syncing ${queue.length} offline shifts to server...`)

            let hadErrors = false

            for (const job of queue) {
                console.log("Processing sync job:", job.id, job.type)

                if (job.retries > 3) {
                    toast.error('A sync job failed permanently.')
                    removeJob(job.id)
                    continue
                }

                try {
                    // Send entire job over Server Action where HttpOnly cookies are resolved
                    await processOfflineSyncJob(job)

                    // Success! Remove from IDB
                    removeJob(job.id)
                } catch (err: any) {
                    console.error('Offline Sync Error:', err)
                    hadErrors = true
                    incrementRetry(job.id)
                }
            }

            setSyncing(false)
            if (hadErrors) {
                toast.error('Some offline records encountered a sync error. We will retry later.', { duration: 6000 })
            } else {
                toast.success('Offline sync complete!')
            }
            router.refresh()
        }

        // Attach listeners
        window.addEventListener('online', flushQueue)

        // Try on mount
        flushQueue()

        return () => window.removeEventListener('online', flushQueue)
    }, [queue, isSyncing, setSyncing, removeJob, incrementRetry])

    return <>{children}</>
}
