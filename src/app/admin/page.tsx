import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, UserCheck, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { DashboardChart } from '@/components/dashboard-chart'

export default async function DashboardPage() {
    const supabase = await createClient()

    // 1. Total Active Guards
    const { count: activeGuards } = await supabase
        .from('guards')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    // 2. Total Active Sites
    const { count: activeSites } = await supabase
        .from('sites')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    // 3. Guards On Duty (Checked in today, not checked out)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startISO = startOfDay.toISOString()

    const { count: onDuty } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', startISO)
        .is('check_out_time', null)

    // 4. Absent Alerts (Cross-referencing assignments with today's attendance)
    const todayStr = startOfDay.toISOString().split('T')[0]

    // Get assignments active today
    const { data: boundedAssigments } = await supabase
        .from('assignments')
        .select('id, guard_id, site_id, guards(full_name, phone), sites(name)')
        .lte('start_date', todayStr)
        .filter('end_date', 'gte', todayStr)

    const { data: ongoingAssignments } = await supabase
        .from('assignments')
        .select('id, guard_id, site_id, guards(full_name, phone), sites(name)')
        .lte('start_date', todayStr)
        .is('end_date', null)

    const allAssignments = [...(boundedAssigments || []), ...(ongoingAssignments || [])]

    // Get all attendance for today
    const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('guard_id')
        .gte('check_in_time', startISO)

    const checkedInGuardIds = todayAttendance?.map(a => a.guard_id) || []

    // Filter assignments where the guard hasn't checked in
    const absentGuards = allAssignments.filter(a => !checkedInGuardIds.includes(a.guard_id))

    // 5. Fetch Last 7 Days Attendance for the Graph
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Quick grouping using postgres date_trunc would be faster, but for simple MVP we fetch and group
    const { data: weekAttendance } = await supabase
        .from('attendance')
        .select('check_in_time')
        .gte('check_in_time', sevenDaysAgo.toISOString())

    const chartData = []
    for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' })
        const countsForDay = (weekAttendance || []).filter(a => {
            const attDate = new Date(a.check_in_time)
            return attDate.getDate() === d.getDate() && attDate.getMonth() === d.getMonth()
        }).length

        chartData.push({
            date: dateStr,
            count: countsForDay
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Dashboard Hub</h2>
                <p className="text-muted-foreground">
                    Live overview of Kavach Securities operations.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/guards" className="transition-transform hover:scale-[1.02]">
                    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Guards</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeGuards || 0}</div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/sites" className="transition-transform hover:scale-[1.02]">
                    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeSites || 0}</div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/attendance" className="transition-transform hover:scale-[1.02]">
                    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Guards On Duty</CardTitle>
                            <UserCheck className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">{onDuty || 0}</div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Absent Alerts */}
            {absentGuards.length > 0 && (
                <Card className="border-orange-200 shadow-sm mt-6">
                    <CardHeader className="bg-orange-50/50 border-b border-orange-100 pb-4">
                        <div className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-5 w-5" />
                            <CardTitle className="text-lg">Missing Staff Alerts</CardTitle>
                        </div>
                        <p className="text-sm text-orange-600/80">
                            The following guards are scheduled for today but have not checked in yet.
                        </p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-orange-100">
                            {absentGuards.map((absent, idx) => (
                                <div key={idx} className="p-4 flex justify-between items-center hover:bg-orange-50/20 transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-900">{(absent.guards as any)?.full_name}</p>
                                        <p className="text-sm text-gray-500">Scheduled at: <span className="text-gray-700 font-medium">{(absent.sites as any)?.name}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-600">{(absent.guards as any)?.phone || 'No phone'}</p>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                                            Not Checked In
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <DashboardChart data={chartData} />
        </div>
    )
}
