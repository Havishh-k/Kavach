import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertsWidget } from '@/components/alerts-widget'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Middleware handles the primary protection, but it's good practice 
    // to fetch the user here if we need to display their name or email.
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <SidebarProvider>
            <div className="flex w-full h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
                <AppSidebar />
                <main className="flex-1 flex flex-col h-full overflow-y-auto">
                    <header className="flex items-center h-16 px-4 border-b shrink-0 bg-white dark:bg-neutral-900 border-border">
                        <SidebarTrigger className="mr-4" />
                        <div className="ml-auto flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                            <AlertsWidget />
                        </div>
                    </header>
                    <div className="flex-1 p-6">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}
