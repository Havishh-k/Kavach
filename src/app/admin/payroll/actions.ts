'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPayrollConfigs() {
    const supabase = await createClient()

    // Fetch active assignments with their tailored pay rates
    const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
            id,
            hourly_rate,
            ot_multiplier,
            payment_type,
            guards!inner ( full_name ),
            sites!inner ( name )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching assignment rate configs:", error)
        return []
    }

    return assignments
}

export async function upsertPayrollConfig(
    guardId: string, 
    baseRate: number, 
    otMultiplier: number,
    paymentType: string = 'hourly',
    baseMonthlyRate: number = 0
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('payroll_config')
        .upsert({
            guard_id: guardId,
            base_hourly_rate: baseRate,
            ot_multiplier: otMultiplier,
            payment_type: paymentType,
            base_monthly_rate: baseMonthlyRate,
            effective_from: new Date().toISOString().split('T')[0]
        }, { onConflict: 'guard_id' })

    if (error) {
        console.error("Error updating payroll config:", error)
        return { error: error.message }
    }

    revalidatePath('/payroll')
    return { success: true }
}

export async function getMonthlyGrossPaySummary() {
    // Generate a basic rollup for the last 30 days
    const supabase = await createClient()

    // In a production scenario, we'd take a specific month (e.g. Feb 2026)
    // Here we'll just sum all attendance records per guard
    const { data: attendance, error } = await supabase
        .from('attendance')
        .select(`
            guard_id,
            regular_hours,
            ot_hours,
            guards:guard_id ( full_name ),
            assignments:assignment_id ( hourly_rate, ot_multiplier )
        `)

    if (error) {
        console.error("Error fetching attendance for summary:", error)
        return []
    }

    // Aggregate by guard
    const summary: Record<string, any> = {}

    for (const record of attendance) {
        if (!record.guards) continue

        const gId = record.guard_id
        const guardsObj = Array.isArray(record.guards) ? record.guards[0] as any : record.guards as any
        const assignObj = Array.isArray(record.assignments) ? record.assignments[0] as any : record.assignments as any
        
        const baseRate = assignObj?.hourly_rate || 0
        const otMultiplier = assignObj?.ot_multiplier || 1.5

        if (!summary[gId]) {
            summary[gId] = {
                guard_id: gId,
                full_name: guardsObj?.full_name || 'Unknown Guard',
                total_regular_hours: 0,
                total_ot_hours: 0,
                gross_pay: 0,
                shifts_worked: 0
            }
        }

        const regHrs = Number(record.regular_hours || 0)
        const otHrs = Number(record.ot_hours || 0)
        
        summary[gId].total_regular_hours += regHrs
        summary[gId].total_ot_hours += otHrs
        summary[gId].gross_pay += (regHrs * baseRate) + (otHrs * baseRate * otMultiplier)
        summary[gId].shifts_worked += 1
    }

    // Calculate final
    return Object.values(summary)
}
