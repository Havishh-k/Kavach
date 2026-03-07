'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSites() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching sites:', error)
        return []
    }
    return data
}

export async function createSite(formData: FormData) {
    const supabase = await createClient()

    const data = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        contact_person: formData.get('contact_person') as string,
        contact_phone: formData.get('contact_phone') as string,
        is_active: true
    }

    const { error } = await supabase.from('sites').insert(data)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/sites')
    return { success: true }
}

export async function updateSite(id: string, formData: FormData) {
    const supabase = await createClient()

    const data = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        contact_person: formData.get('contact_person') as string,
        contact_phone: formData.get('contact_phone') as string,
    }

    const { error } = await supabase
        .from('sites')
        .update(data)
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/sites')
    return { success: true }
}

export async function deleteSite(id: string) {
    const supabase = await createClient()

    // Soft Delete
    const { error } = await supabase
        .from('sites')
        .update({ is_active: false })
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/sites')
    return { success: true }
}
