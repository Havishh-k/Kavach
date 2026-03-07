'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGuards() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('guards')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching guards:', error)
        return []
    }
    return data
}

export async function createGuard(formData: FormData) {
    const supabase = await createClient()

    // For MVP, user_id is optional since we aren't creating auth accounts for guards yet 
    // (Phase 2 will handle Guard Auth, these are just profile records for the Admin to assign)
    const data = {
        full_name: formData.get('full_name') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        id_card_number: formData.get('id_card_number') as string,
        id_issue_date: formData.get('id_issue_date') as string,
        id_expiry_date: formData.get('id_expiry_date') as string,
        is_active: true
    }

    const { error } = await supabase.from('guards').insert(data)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/guards')
    return { success: true }
}

export async function updateGuard(id: string, formData: FormData) {
    const supabase = await createClient()

    const data = {
        full_name: formData.get('full_name') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        id_card_number: formData.get('id_card_number') as string,
        id_issue_date: formData.get('id_issue_date') as string,
        id_expiry_date: formData.get('id_expiry_date') as string,
    }

    const { error } = await supabase
        .from('guards')
        .update(data)
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/guards')
    return { success: true }
}

export async function deleteGuard(id: string) {
    const supabase = await createClient()

    // Soft Delete
    const { error } = await supabase
        .from('guards')
        .update({ is_active: false })
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/guards')
    return { success: true }
}
