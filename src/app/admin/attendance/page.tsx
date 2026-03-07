import { createClient } from '@/lib/supabase/server'
import { AttendanceClient } from './attendance-client'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
    const supabase = await createClient()

    // Fetch initial data for SSR/fast loading
    // Joining with guards and sites
    const { data: initialAttendance } = await supabase
        .from('attendance')
        .select(`
            id,
            check_in_time,
            check_out_time,
            check_in_selfie_url,
            check_out_selfie_url,
            check_in_lat,
            check_in_lng,
            check_out_lat,
            check_out_lng,
            status,
            is_offline_sync,
            device_uptime_seconds,
            guards:guard_id(id, full_name, phone),
            sites:site_id(id, name)
        `)
        .order('check_in_time', { ascending: false })
        .limit(100)

    // Ensure it's correctly shaped
    const records = initialAttendance?.map((item: any) => ({
        ...item,
        guards: Array.isArray(item.guards) ? item.guards[0] : item.guards,
        sites: Array.isArray(item.sites) ? item.sites[0] : item.sites,
    })) || []

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Live Attendance Dashboard</h2>
                    <p className="text-muted-foreground">
                        Monitor active shifts and historical attendance across all sites.
                    </p>
                </div>
            </div>

            {/* Client Component handles Realtime & Filters */}
            <AttendanceClient initialData={records} />
        </div>
    )
}
