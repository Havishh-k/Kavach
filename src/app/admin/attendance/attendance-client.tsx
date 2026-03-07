'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { WifiOff, Search, Map, CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { AttendanceDialog } from './attendance-dialog'

interface AttendanceRecord {
    id: string
    check_in_time: string
    check_out_time: string | null
    check_in_selfie_url: string
    check_out_selfie_url: string | null
    status: string
    is_offline_sync: boolean
    guards?: { id: string, full_name: string } | null
    sites?: { id: string, name: string } | null
}

interface Props {
    initialData: AttendanceRecord[]
}

export function AttendanceClient({ initialData }: Props) {
    const [records, setRecords] = useState<AttendanceRecord[]>(initialData)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterSite, setFilterSite] = useState<string>('all')
    const [date, setDate] = useState<Date | undefined>(new Date())

    // Using the imported supabase singleton directly

    useEffect(() => {
        // Setup Supabase Realtime Subscription!
        const channel = supabase.channel('realtime_attendance')

        channel.on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'attendance'
            },
            async (payload) => {
                console.log('Realtime Event Received!', payload)

                // When an insert or update happens, we must re-fetch the joined guard/site names
                // It's less efficient but necessary since payload.new only has foreign keys.
                // An Edge Function joining row on broadcast would be better for high volumes, but this handles MVP.
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const rowId = payload.new.id

                    const { data: updatedRow } = await supabase
                        .from('attendance')
                        .select(`
                            id,
                            check_in_time,
                            check_out_time,
                            status,
                            is_offline_sync,
                            guards:guard_id(id, full_name, phone),
                            sites:site_id(id, name)
                        `)
                        .eq('id', rowId)
                        .single()

                    if (updatedRow) {
                        setRecords(prev => {
                            const exists = prev.find(r => r.id === rowId)
                            if (exists) {
                                return prev.map(r => r.id === rowId ? updatedRow as any : r)
                            } else {
                                return [updatedRow as any, ...prev]
                            }
                        })
                    }
                }

                if (payload.eventType === 'DELETE') {
                    setRecords(prev => prev.filter(r => r.id !== payload.old.id))
                }
            }
        ).subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    // Apply Client-Side Filters
    const filteredRecords = records.filter(record => {
        const matchesSearch =
            record.guards?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.sites?.name?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesSite = filterSite === 'all' || record.sites?.id === filterSite

        return matchesSearch && matchesSite
    })

    // Extract unique sites for the filter dropdown
    const uniqueSites = Array.from(new Set(records.map(r => r.sites?.id).filter(Boolean))).map(id => {
        return records.find(r => r.sites?.id === id)?.sites
    })

    return (
        <Card className="mt-4">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search guard or site..."
                        className="pl-9 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={filterSite}
                        onChange={(e) => setFilterSite(e.target.value)}
                    >
                        <option value="all">All Sites</option>
                        {uniqueSites.map(site => site && (
                            <option key={site.id} value={site.id}>{site.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Guard Name</TableHead>
                            <TableHead>Site Location</TableHead>
                            <TableHead>Check In</TableHead>
                            <TableHead>Check Out</TableHead>
                            <TableHead>Sync Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRecords.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No attendance records found matching filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRecords.map((record) => (
                                <TableRow key={record.id} className="group">
                                    <TableCell className="font-medium">
                                        {record.guards?.full_name || 'Unknown Guard'}
                                    </TableCell>
                                    <TableCell>{record.sites?.name || 'Unknown Site'}</TableCell>

                                    <TableCell>
                                        <div className="text-sm">
                                            <div>{format(new Date(record.check_in_time), 'PP')}</div>
                                            <div className="text-muted-foreground">
                                                {format(new Date(record.check_in_time), 'p')}
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        {record.check_out_time ? (
                                            <div className="text-sm">
                                                <div>{format(new Date(record.check_out_time), 'PP')}</div>
                                                <div className="text-muted-foreground">
                                                    {format(new Date(record.check_out_time), 'p')}
                                                </div>
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                Active Shift
                                            </Badge>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {record.is_offline_sync ? (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 flex items-center w-fit gap-1">
                                                <WifiOff className="h-3 w-3" />
                                                Offline Sync
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Live</span>
                                        )}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <AttendanceDialog record={record as any} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
