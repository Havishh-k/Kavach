'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPayrollConfigs() {
    const supabase = await createClient()

    // We fetch guards and their existing payroll config (if any)
    const { data: guards, error } = await supabase
        .from('guards')
        .select(`
            id,
            full_name,
            phone,
            payroll_config (
                id,
                base_hourly_rate,
                ot_multiplier
            )
        `)
        .eq('is_active', true)

    if (error) {
        console.error("Error fetching payroll configs:", error)
        return []
    }

    return guards
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
            guards:guard_id ( full_name, payroll_config ( base_hourly_rate, ot_multiplier ) )
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
        
        if (!summary[gId]) {
            const config = Array.isArray(guardsObj.payroll_config) 
                ? guardsObj.payroll_config[0] 
                : guardsObj.payroll_config
                
            summary[gId] = {
                guard_id: gId,
                full_name: guardsObj.full_name,
                total_regular_hours: 0,
                total_ot_hours: 0,
                base_rate: config?.base_hourly_rate || 0,
                ot_multiplier: config?.ot_multiplier || 1.5,
                shifts_worked: 0
            }
        }

        summary[gId].total_regular_hours += Number(record.regular_hours || 0)
        summary[gId].total_ot_hours += Number(record.ot_hours || 0)
        summary[gId].shifts_worked += 1
    }

    // Calculate final
    return Object.values(summary).map(s => {
        const regularPay = s.total_regular_hours * s.base_rate
        const otPay = s.total_ot_hours * (s.base_rate * s.ot_multiplier)
        return {
            ...s,
            gross_pay: regularPay + otPay
        }
    })
}
