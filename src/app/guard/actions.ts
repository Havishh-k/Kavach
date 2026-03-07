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
