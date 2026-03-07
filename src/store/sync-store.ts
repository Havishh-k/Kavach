import { create } from 'zustand'
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'

// Custom persister wrapper for idb-keyval
const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name)) || null
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value)
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name)
    },
}

export type SyncJobType = 'ATTENDANCE_CHECK_IN' | 'ATTENDANCE_CHECK_OUT'

export interface SyncJob {
    id: string // UUID for the job
    type: SyncJobType
    payload: any // The data to send, including base64 image if applicable
    retries: number
    deviceTimestamp: string // ISO string of exact time interaction happened offline
}

interface SyncState {
    queue: SyncJob[]
    isSyncing: boolean
    addJob: (job: Omit<SyncJob, 'retries'>) => void
    removeJob: (id: string) => void
    incrementRetry: (id: string) => void
    setSyncing: (status: boolean) => void
}

export const useSyncStore = create<SyncState>()(
    persist(
        (set, get) => ({
            queue: [],
            isSyncing: false,
            addJob: (job) => {
                set((state) => ({
                    queue: [...state.queue, { ...job, retries: 0 }],
                }))
            },
            removeJob: (id) => {
                set((state) => ({
                    queue: state.queue.filter((job) => job.id !== id),
                }))
            },
            incrementRetry: (id) => {
                set((state) => ({
                    queue: state.queue.map((job) =>
                        job.id === id ? { ...job, retries: job.retries + 1 } : job
                    ),
                }))
            },
            setSyncing: (status) => set({ isSyncing: status }),
        }),
        {
            name: 'kavach-sync-storage',
            storage: createJSONStorage(() => storage),
            partialize: (state) => ({ queue: state.queue }),
        }
    )
)
