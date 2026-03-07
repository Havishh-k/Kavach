'use client'

import { useEffect } from 'react'
import { useSyncStore } from '@/store/sync-store'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Decode Base64 to Blob helper
function dataURItoBlob(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1])
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
    }
    return new Blob([ab], { type: mimeString })
}

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
                    // Grab payload and strip out non-schema attributes
                    const { selfieBase64, guard_id, assignment_id, deviceTimestamp, type, id, ...attendanceData } = job.payload

                    let selfieUrl = ''

                    // Upload Image first
                    if (selfieBase64) {
                        const { data: { session } } = await supabase.auth.getSession()
                        if (!session?.user) throw new Error("User not authenticated.")

                        const blob = dataURItoBlob(selfieBase64)
                        const fileName = `${session.user.id}/${new Date(job.deviceTimestamp).toISOString().split('T')[0]}/${job.id}.jpeg`

                        const { error: uploadError, data: uploadData } = await supabase.storage
                            .from('attendance_selfies')
                            .upload(fileName, blob, {
                                contentType: 'image/jpeg'
                            })

                        if (uploadError) throw uploadError

                        const { data: publicUrlData } = supabase.storage
                            .from('attendance_selfies')
                            .getPublicUrl(uploadData.path)

                        selfieUrl = publicUrlData.publicUrl
                    }

                    if (job.type === 'ATTENDANCE_CHECK_IN') {
                        const finalPayload = {
                            ...attendanceData,
                            guard_id,
                            assignment_id,
                            check_in_selfie_url: selfieUrl,
                            is_offline_sync: true
                        }
                        const { error: dbError } = await supabase
                            .from('attendance')
                            .insert([finalPayload])

                        if (dbError) throw dbError
                    } else if (job.type === 'ATTENDANCE_CHECK_OUT') {
                        const finalPayload = {
                            ...attendanceData,
                            check_out_selfie_url: selfieUrl,
                            is_offline_sync: true
                        }
                        const { error: dbError } = await supabase
                            .from('attendance')
                            .update(finalPayload)
                            .eq('id', id)

                        if (dbError) throw dbError
                    }

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
    }, [queue, isSyncing, setSyncing, removeJob, incrementRetry, supabase])

    return <>{children}</>
}
