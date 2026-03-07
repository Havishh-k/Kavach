import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { logout } from './actions'
import { CheckInClient } from '@/components/guard/check-in-client'
import { RosterClient } from '@/components/guard/roster-client'
import { PushNotificationPrompt } from '@/components/guard/push-prompt'

import { GuardDashboardClient } from '@/components/guard/guard-dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Attempt to grab Guard info
  const guardQuery = await supabase
    .from('guards')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const guard = guardQuery.data

  if (!guard) {
    return <div>Could not retrieve guard profile. Contact HQ.</div>
  }

  // 3. Fetch all upcoming/ongoing assignments for the Roster
  const now = new Date();
  
  // Format securely forcing IST (India Standard Time) since Kavach is deployed in India
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Asia/Kolkata', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  
  const todayDateStr = formatter.format(now); // 'YYYY-MM-DD' exactly in IST

  const { data: allAssignments } = await supabase
    .from('assignments')
    .select('*, sites(*)')
    .eq('guard_id', guard.id)
    .or(`end_date.gte.${todayDateStr},end_date.is.null`)
    .order('start_date', { ascending: true })

  // Fetch active assignment safely
  const { data: assignmentDataList } = await supabase
    .from('assignments')
    .select('*, sites(*)')
    .eq('guard_id', guard.id)
    .lte('start_date', todayDateStr)
    .gte('end_date', todayDateStr)
    .order('created_at', { ascending: false })
    .limit(1)

  // Also try to find a null end_date assignment if the above fails
  let activeAssignment = assignmentDataList?.[0]
  if (!activeAssignment) {
    const { data: ongoingList } = await supabase
      .from('assignments')
      .select('*, sites(*)')
      .eq('guard_id', guard.id)
      .lte('start_date', todayDateStr)
      .is('end_date', null)
      .order('created_at', { ascending: false })
      .limit(1)

    activeAssignment = ongoingList?.[0]
  }

  // 2. Fetch Active Attendance for today
  let isAlreadyCheckedIn = false
  let attendanceId = undefined
  let isShiftCompletedToday = false

  if (activeAssignment) {
    // Set startOfDay securely mapped to IST rather than UTC
    const rawDate = new Date()
    // Calculate IST offset (UTC + 5 hours 30 minutes = 330 minutes)
    const istTime = new Date(rawDate.getTime() + (330 * 60 * 1000))
    // Reset to start of day in IST
    istTime.setUTCHours(0, 0, 0, 0)
    // Convert back to UTC for postgres
    const startOfDay = new Date(istTime.getTime() - (330 * 60 * 1000))

    let { data: attendanceData } = await supabase
      .from('attendance')
      .select('id, check_out_time, check_in_time')
      .eq('guard_id', guard.id)
      .eq('assignment_id', activeAssignment.id)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single()

    if (attendanceData && !attendanceData.check_out_time) {
      isAlreadyCheckedIn = true
      attendanceId = attendanceData.id
    } else {
      const { data: completedToday } = await supabase
        .from('attendance')
        .select('id')
        .eq('guard_id', guard.id)
        .eq('assignment_id', activeAssignment.id)
        .gte('check_in_time', startOfDay.toISOString())
        .not('check_out_time', 'is', null)
        .limit(1)
        .single()

      if (completedToday) {
        isShiftCompletedToday = true
      }
    }
  }

  if (isShiftCompletedToday) {
    activeAssignment = null
  }

  const checkInNode = !activeAssignment ? (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 mt-12 bg-[#012f6b] rounded-3xl border border-[#024a8f] shadow-xl">
      <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
        <span className="text-2xl">😎</span>
      </div>
      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">You're Off Duty!</h2>
      <p className="text-neutral-400">
        You are not assigned to any site for today. Enjoy your time off!
      </p>
    </div>
  ) : (
    <CheckInClient
      guardId={guard.id}
      assignmentId={activeAssignment.id}
      siteId={activeAssignment.site_id}
      siteName={activeAssignment.sites?.name || 'Unknown Site'}
      isAlreadyCheckedIn={isAlreadyCheckedIn}
      attendanceId={attendanceId}
    />
  )

  const rosterNode = (
    <RosterClient
      assignments={allAssignments || []}
      activeAssignmentId={activeAssignment?.id}
    />
  )

  const settingsNode = (
    <div className="space-y-6">
      <div className="mb-4">
        <p className="text-sm font-medium text-neutral-400 mb-1">Full Name</p>
        <p className="text-lg font-semibold text-white">{guard.full_name}</p>
      </div>
      <div className="mb-4">
        <p className="text-sm font-medium text-neutral-400 mb-1">ID Card</p>
        <p className="text-lg font-medium text-neutral-200">{guard.id_card_number || 'N/A'}</p>
      </div>
      <div className="mb-8">
        <p className="text-sm font-medium text-neutral-400 mb-1">Contact</p>
        <p className="text-lg font-medium text-neutral-200">{guard.phone || 'N/A'}</p>
      </div>

      <div className="pt-6 border-t border-[#024a8f]">
        <h3 className="text-lg font-semibold text-white mb-4">App Preferences</h3>
        <PushNotificationPrompt guardId={guard.id} />
      </div>
    </div>
  )

  return (
    <GuardDashboardClient
      guardName={guard.full_name}
      checkInTab={checkInNode}
      rosterTab={rosterNode}
      settingsTab={settingsNode}
      onLogout={async () => {
        'use server'
        await logout()
      }}
    />
  )
}

