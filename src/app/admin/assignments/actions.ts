'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAssignments() {
    const supabase = await createClient()

    // Notice we must join with guards and sites to get names
    const { data, error } = await supabase
        .from('assignments')
        .select(`
      *,
      guards!inner(full_name, is_active),
      sites!inner(name, is_active)
    `)
        // If you want to soft delete assignments, you could add an is_active column.
        // The schema didn't explicitly add is_active to assignments, so we just list all,
        // or we could delete them directly. For this MVP we will hard delete if there's no is_active column.
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching assignments:', error)
        return []
    }
    return data
}

export async function createAssignment(formData: FormData) {
    const supabase = await createClient()

    const data = {
        guard_id: formData.get('guard_id') as string,
        site_id: formData.get('site_id') as string,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') ? (formData.get('end_date') as string) : null,
        shift_start_time: formData.get('shift_start_time') as string,
        shift_end_time: formData.get('shift_end_time') as string,
        payment_type: formData.get('payment_type') as string || 'hourly',
        hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate') as string) : null,
    }

    const { error } = await supabase.from('assignments').insert(data)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/assignments')
    return { success: true }
}

export async function updateAssignment(id: string, formData: FormData) {
    const supabase = await createClient()

    const data = {
        guard_id: formData.get('guard_id') as string,
        site_id: formData.get('site_id') as string,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') ? (formData.get('end_date') as string) : null,
        shift_start_time: formData.get('shift_start_time') as string,
        shift_end_time: formData.get('shift_end_time') as string,
        payment_type: formData.get('payment_type') as string || 'hourly',
        hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate') as string) : null,
    }

    const { error } = await supabase
        .from('assignments')
        .update(data)
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/assignments')
    return { success: true }
}

export async function deleteAssignment(id: string) {
    const supabase = await createClient()

    // The schema doesn't have an is_active column for assignments, so we perform a hard delete.
    // Assignments are joined to attendance, so consider cascading implications if attendance exists.
    const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/assignments')
    return { success: true }
}
