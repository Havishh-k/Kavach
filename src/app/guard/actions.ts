'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function savePushSubscription(guardId: string, subscriptionData: any) {
    const supabase = await createClient()
    
    // Check if sub already exists to prevent duplicates
    const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('guard_id', guardId)
        .contains('subscription_data', { endpoint: subscriptionData.endpoint })
        .maybeSingle()
        
    if (existing) {
        return { success: true, message: 'Already subscribed' }
    }

    const { error } = await supabase
        .from('push_subscriptions')
        .insert({
            guard_id: guardId,
            subscription_data: subscriptionData
        })

    if (error) {
        console.error('Error saving subscription:', error)
        return { success: false, error: error.message }
    }
    
    return { success: true }
}

// Helper to decode Base64 in Node environments
function dataURItoBuffer(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1])
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
    }
    return Buffer.from(ab)
}

export async function processOfflineSyncJob(job: any) {
    const supabase = await createClient()

    // Grab the securely verified session to satisfy RLS!
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error(`User not authenticated: ${authError?.message || 'No session'}`)
    }

    const { selfieBase64, guard_id, assignment_id, deviceTimestamp, type, id, ...attendanceData } = job.payload
    let selfieUrl = ''

    if (selfieBase64) {
        const buffer = dataURItoBuffer(selfieBase64)
        const fileName = `${user.id}/${new Date(job.deviceTimestamp).toISOString().split('T')[0]}/${job.id}.jpeg`

        const { error: uploadError, data: uploadData } = await supabase.storage
            .from('attendance_selfies')
            .upload(fileName, buffer, {
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

    return { success: true }
}
