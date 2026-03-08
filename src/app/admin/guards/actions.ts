'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export async function setGuardAuthCredentials(guardId: string, email: string, password: string) {
    const supabaseAdmin = createAdminClient()
    const supabase = await createClient()

    // Ensure the requester is an admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'admin') {
        return { success: false, error: 'Unauthorized. Only admins can assign credentials.' }
    }

    // 1. Check if the guard exists and already has a user_id
    const { data: guard, error: guardError } = await supabaseAdmin
        .from('guards')
        .select('user_id')
        .eq('id', guardId)
        .single()

    if (guardError || !guard) {
        return { success: false, error: 'Guard not found.' }
    }

    try {
        if (guard.user_id) {
            // Guard already has an account, update credentials
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                guard.user_id,
                { email, password }
            )
            if (updateError) throw updateError
        } else {
            // Guard has no account, create one
            const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { role: 'guard', guard_id: guardId }
            })

            if (createError) throw createError
            if (!authData.user) throw new Error("Failed to generate Auth user.")

            // Link the auth user to the guard profile
            const { error: linkError } = await supabaseAdmin
                .from('guards')
                .update({ user_id: authData.user.id })
                .eq('id', guardId)

            if (linkError) throw linkError
        }

        revalidatePath('/admin/guards')
        return { success: true }
    } catch (e: any) {
        console.error('Credential setup failed:', e)
        return { success: false, error: e.message || 'Operation failed' }
    }
}
