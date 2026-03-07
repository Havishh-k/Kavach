'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

type AdminAlert = {
    id: string
    type: 'missing_check_in' | 'late_check_out' | 'other'
    message: string
    is_read: boolean
    created_at: string
}

export function AlertsWidget() {
    const [alerts, setAlerts] = useState<AdminAlert[]>([])
    const [unreadCount, setUnreadCount] = useState(0)


    useEffect(() => {
        // Fetch initial unread alerts
        const fetchAlerts = async () => {
            const { data } = await supabase
                .from('admin_alerts')
                .select('*')
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(10)

            if (data) {
                setAlerts(data as AdminAlert[])
                setUnreadCount(data.length)
            }
        }

        fetchAlerts()

        // Subscribe to realtime insert events on admin_alerts table
        const channel = supabase
            .channel('admin_alerts_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'admin_alerts',
                },
                (payload) => {
                    const newAlert = payload.new as AdminAlert
                    setAlerts((prev) => [newAlert, ...prev].slice(0, 10))
                    setUnreadCount((prev) => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    const markAsRead = async (id: string) => {
        // Optimistic UI update
        setAlerts((prev) => prev.filter((a) => a.id !== id))
        setUnreadCount((prev) => Math.max(0, prev - 1))

        await supabase
            .from('admin_alerts')
            .update({ is_read: true })
            .eq('id', id)
    }

    const markAllAsRead = async () => {
        setAlerts([])
        setUnreadCount(0)

        await supabase
            .from('admin_alerts')
            .update({ is_read: true })
            .eq('is_read', false)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="link"
                            className="h-auto p-0 text-xs text-muted-foreground"
                            onClick={(e) => {
                                e.preventDefault()
                                markAllAsRead()
                            }}
                        >
                            Mark all as read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {alerts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No new notifications
                    </div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                        {alerts.map((alert) => (
                            <DropdownMenuItem
                                key={alert.id}
                                className="flex flex-col items-start p-3 gap-1 cursor-pointer"
                                onClick={(e) => {
                                    e.preventDefault()
                                    markAsRead(alert.id)
                                }}
                            >
                                <div className="text-sm font-medium leading-none">
                                    {alert.type === 'missing_check_in' ? '⚠️ Missing Check-In' : '🔔 Alert'}
                                </div>
                                <div className="text-sm text-muted-foreground line-clamp-2">
                                    {alert.message}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
