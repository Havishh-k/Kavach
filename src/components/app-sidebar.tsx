'use client'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar'
import {
    Users,
    MapPin,
    CalendarCheck,
    ClipboardList,
    Banknote,
    LogOut,
    ShieldCheck,
} from 'lucide-react'
import { logout } from '@/app/admin/actions'
import Link from 'next/link'

const navItems = [
    {
        title: 'Dashboard',
        url: '/admin',
        icon: ShieldCheck,
    },
    {
        title: 'Guards',
        url: '/admin/guards',
        icon: Users,
    },
    {
        title: 'Sites',
        url: '/admin/sites',
        icon: MapPin,
    },
    {
        title: 'Assignments',
        url: '/admin/assignments',
        icon: CalendarCheck,
    },
    {
        title: 'Attendance',
        url: '/admin/attendance',
        icon: ClipboardList,
    },
    {
        title: 'Payroll',
        url: '/admin/payroll',
        icon: Banknote,
    },
]

export function AppSidebar() {
    const { setOpenMobile, isMobile } = useSidebar()

    return (
        <Sidebar>
            <SidebarHeader className="h-16 flex items-center px-6 border-b border-border">
                <h2 className="text-lg font-bold tracking-tight text-primary">Kavach Securities</h2>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Management</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url} onClick={() => isMobile && setOpenMobile(false)}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t border-border p-4">
                <form action={logout}>
                    <SidebarMenuButton type="submit" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Sign Out</span>
                    </SidebarMenuButton>
                </form>
            </SidebarFooter>
        </Sidebar>
    )
}
